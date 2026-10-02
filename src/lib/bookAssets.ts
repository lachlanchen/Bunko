import { BOOK_ORIGINS, fetchBook, validBookPath } from './bookTransport'
const ASSET_CACHE = 'bunko-book-assets-v1'
const COVER_CACHE = 'bunko-covers'
const pending = new Map<string, Promise<Response>>()

export function assetUrl(bookId: string, path: string): string {
  return `${BOOK_ORIGINS[0]}/books/${bookId}/${path}`
}

export async function loadBookImage(path: string): Promise<Response> {
  if (!validBookPath(path) || !/\.(png|jpe?g|webp)$/.test(path)) throw new Error('Invalid book image')
  let operation = pending.get(path)
  if (!operation) {
    operation = (async () => {
      const cover = /\/cover-/.test(path), url = `${BOOK_ORIGINS[0]}/${path}`
      let cache: Cache | undefined
      try {
        if ('caches' in globalThis) cache = await caches.open(cover ? COVER_CACHE : ASSET_CACHE)
        const cached = await cache?.match(url)
        if (cached) return cached
      } catch { /* Private browsing can disable persistent caches. */ }
      const response = await fetchBook(path)
      try {
        await cache?.put(url, response.clone())
        if (cover && cache) {
          const keys = await cache.keys()
          for (const key of keys.slice(0, Math.max(0, keys.length - 200))) await cache.delete(key)
        }
      } catch { /* A full cache must not prevent reading. */ }
      return response
    })().finally(() => pending.delete(path))
    pending.set(path, operation)
  }
  return (await operation).clone()
}

export async function cacheFigure(bookId: string, path: string): Promise<void> {
  await loadBookImage(`books/${bookId}/${path}`)
}

export async function cachedFigure(bookId: string, path: string): Promise<Response | undefined> {
  if (!('caches' in window)) return undefined
  return (await caches.open(ASSET_CACHE)).match(assetUrl(bookId, path))
}

export async function removeFigures(bookId: string): Promise<void> {
  if (!('caches' in window)) return
  const cache = await caches.open(ASSET_CACHE)
  const prefix = assetUrl(bookId, 'assets/')
  for (const request of await cache.keys()) if (request.url.startsWith(prefix)) await cache.delete(request)
}
