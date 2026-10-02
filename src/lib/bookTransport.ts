/** Public book payloads only. Credentials and account requests never use mirrors. */
export const BOOK_ORIGINS = [
  'https://raw.githubusercontent.com/lachlanchen/bunko-books/main',
  'https://cdn.jsdelivr.net/gh/lachlanchen/bunko-books@main',
  'https://llm.lazying.art/bunko/books-cache',
] as const

export function validBookPath(path: string): boolean {
  if (path.length > 300 || path.includes('..')) return false
  return /^(?:reader-index\.json|dictionaries\/(?:manifest\.json|(?:en|zh|ja)-[a-zA-Z0-9-]+\.json\.gz)|books\/[a-z0-9-]+\/(?:meta\.json|c[0-9]+(?:p[0-9]+)?(?:-[a-f0-9]+)?\.json|cover-[a-f0-9]+\.(?:webp|png|jpg)|assets\/[a-zA-Z0-9/_-]+\.(?:png|jpe?g|webp)))$/.test(path)
}

const aborted = () => new DOMException('Download cancelled', 'AbortError')
const mutable = (path: string) => path === 'reader-index.json' || path.endsWith('/meta.json') || path === 'dictionaries/manifest.json'

export function createBookTransport({ fetcher = fetch, now = Date.now, timeout = 8000, idleTimeout = 20000 } = {}) {
  const failedUntil = new Map<string, number>()
  const pending = new Map<string, { promise: Promise<Response>; controller: AbortController; readers: number }>()
  async function download(path: string, signal: AbortSignal): Promise<Response> {
    let lastError: unknown = new Error('Book download unavailable')
    const healthy = BOOK_ORIGINS.filter(origin => (failedUntil.get(origin) ?? 0) <= now())
    // A short circuit breaker avoids repeated waits on a blocked host. GitHub
    // becomes first again after 60 seconds. Never race full downloads.
    for (const origin of healthy.length ? healthy : BOOK_ORIGINS) {
      if (signal.aborted) throw aborted()
      const controller = new AbortController()
      const abort = () => controller.abort()
      signal.addEventListener('abort', abort, { once: true })
      let timer = setTimeout(abort, timeout)
      let status = 0
      try {
        const response = await fetcher(`${origin}/${path}`, { signal: controller.signal, credentials: 'omit', redirect: 'error', cache: mutable(path) ? 'no-cache' : 'default' })
        status = response.status
        if (!response.ok) { await response.body?.cancel(); throw new Error(`Book download: ${status}`) }
        if (Number(response.headers.get('content-length')) > 32 * 1024 * 1024) throw new Error('Book file is too large')
        const reader = response.body?.getReader()
        if (!reader) throw new Error('Empty book response')
        const parts: Uint8Array[] = []
        let length = 0
        while (true) {
          clearTimeout(timer); timer = setTimeout(abort, idleTimeout)
          const { value, done } = await reader.read()
          if (done) break
          length += value.byteLength
          if (length > 32 * 1024 * 1024) { await reader.cancel(); throw new Error('Book file is too large') }
          parts.push(value)
        }
        const bytes = new Uint8Array(length)
        let offset = 0
        for (const part of parts) { bytes.set(part, offset); offset += part.byteLength }
        // Captive portals and proxy HTML must not become a cached book.
        if (path.endsWith('.json')) JSON.parse(new TextDecoder().decode(bytes))
        else if (path.endsWith('.gz') && (bytes[0] !== 31 || bytes[1] !== 139)) throw new Error('Invalid dictionary response')
        else if (/\.(png|jpe?g|webp)$/.test(path) && !isBookImage(bytes)) throw new Error('Invalid book image')
        failedUntil.delete(origin)
        return new Response(bytes, { headers: { 'Content-Type': response.headers.get('content-type') || 'application/octet-stream' } })
      } catch (error) {
        if (signal.aborted) throw aborted()
        lastError = error
        if (status !== 404) failedUntil.set(origin, now() + 60_000)
      } finally { controller.abort(); clearTimeout(timer); signal.removeEventListener('abort', abort) }
    }
    throw lastError
  }
  return async function fetchBook(path: string, signal?: AbortSignal): Promise<Response> {
    if (!validBookPath(path)) throw new Error('Invalid book path')
    if (signal?.aborted) throw aborted()
    let operation = pending.get(path)
    if (!operation) {
      const controller = new AbortController()
      operation = { controller, readers: 0, promise: download(path, controller.signal) }
      pending.set(path, operation)
    }
    const current = operation
    current.readers++
    return new Promise<Response>((resolve, reject) => {
      let finished = false
      const finish = () => {
        if (finished) return false
        finished = true
        signal?.removeEventListener('abort', cancel)
        if (--current.readers === 0) {
          current.controller.abort()
          if (pending.get(path) === current) pending.delete(path)
        }
        return true
      }
      const cancel = () => { if (finish()) reject(aborted()) }
      signal?.addEventListener('abort', cancel, { once: true })
      current.promise.then(response => { if (finish()) resolve(response.clone()) }, error => { if (finish()) reject(error) })
    })
  }
}

function isBookImage(bytes: Uint8Array): boolean {
  return (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) ||
    (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
    (new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP')
}

// Resolve fetch at call time so native initialization and test instrumentation work.
export const fetchBook = createBookTransport({ fetcher: (...args) => fetch(...args) })
