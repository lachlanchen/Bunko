import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'

const ROOT = 'https://raw.githubusercontent.com/lachlanchen/bunko-books/main/'
const MAX_FILE = 32 * 1024 * 1024
const error = (status, code) => Object.assign(new Error(code), { status, code })
export function validMirrorPath(path) {
  return typeof path === 'string' && path.length <= 300 && !path.includes('..') &&
    /^(?:reader-index\.json|dictionaries\/(?:manifest\.json|(?:en|zh|ja)-[a-zA-Z0-9-]+\.json\.gz)|books\/[a-z0-9-]+\/(?:meta\.json|c[0-9]+(?:p[0-9]+)?(?:-[a-f0-9]+)?\.json|cover-[a-f0-9]+\.(?:webp|png|jpg)|assets\/[a-zA-Z0-9/_-]+\.(?:png|jpe?g|webp)))$/.test(path)
}
const immutable = path => /\/(?:c[0-9]+(?:p[0-9]+)?|cover)-[a-f0-9]+\./.test(path) || /^dictionaries\/.+\.gz$/.test(path)
function contentType(path, bytes) {
  if (path.endsWith('.json')) { JSON.parse(bytes.toString('utf8')); return 'application/json; charset=utf-8' }
  if (path.endsWith('.gz') && bytes[0] === 31 && bytes[1] === 139) return 'application/gzip'
  if (path.endsWith('.png') && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png'
  if (/\.jpe?g$/.test(path) && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg'
  if (path.endsWith('.webp') && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  throw error(502, 'invalid_book_response')
}

/** Separate bounded public cache. Never reads sessions, private uploads or URLs supplied by a user. */
export function createBookMirror({ database = ':memory:', maxBytes = 512 * 1024 * 1024, fetchImpl = fetch, now = Date.now } = {}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < MAX_FILE || maxBytes > 4 * 1024 ** 3) throw new Error('Invalid book cache capacity')
  const db = new DatabaseSync(database)
  db.exec(`PRAGMA journal_mode=DELETE; PRAGMA busy_timeout=3000;
    CREATE TABLE IF NOT EXISTS files(path TEXT PRIMARY KEY,body BLOB NOT NULL,type TEXT NOT NULL,etag TEXT NOT NULL,upstream TEXT,checked INTEGER NOT NULL,used INTEGER NOT NULL);`)
  // Limit physical growth too; SQLite reuses evicted pages on later inserts.
  const pageSize = db.prepare('PRAGMA page_size').get().page_size
  db.exec(`PRAGMA max_page_count=${Math.ceil((maxBytes + 2 * MAX_FILE) / pageSize)}`)
  const pending = new Map(), missing = new Map()
  let closed = false, serving = 0
  async function refresh(path, cached) {
    if (pending.size >= 4) throw error(503, 'book_mirror_busy')
    const response = await fetchImpl(ROOT + path, {
      headers: { 'User-Agent': 'Bunko-Book-Cache', ...(cached?.upstream ? { 'If-None-Match': cached.upstream } : {}) },
      redirect: 'error', credentials: 'omit', signal: AbortSignal.timeout(25000),
    })
    if (response.status === 304 && cached) {
      db.prepare('UPDATE files SET checked=?,used=? WHERE path=?').run(now(), now(), path)
      return { ...cached, checked: now(), stale: false }
    }
    if (response.status === 404) {
      await response.body?.cancel()
      db.prepare('DELETE FROM files WHERE path=?').run(path)
      if (missing.size >= 1000) missing.clear()
      missing.set(path, now() + 60000)
      throw error(404, 'book_not_found')
    }
    if (!response.ok) { await response.body?.cancel(); throw error(502, 'book_upstream_unavailable') }
    if (Number(response.headers.get('content-length')) > MAX_FILE) { await response.body?.cancel(); throw error(502, 'book_too_large') }
    const reader = response.body?.getReader()
    if (!reader) throw error(502, 'invalid_book_response')
    const chunks = []; let size = 0
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_FILE) { await reader.cancel(); throw error(502, 'book_too_large') }
      chunks.push(value)
    }
    const body = Buffer.concat(chunks), type = contentType(path, body)
    const etag = '"' + createHash('sha256').update(body).digest('hex') + '"'
    const entry = { path, body, type, etag, upstream: response.headers.get('etag'), checked: now(), used: now(), stale: false }
    db.exec('BEGIN IMMEDIATE')
    try {
      db.prepare('DELETE FROM files WHERE path=?').run(path)
      let total = db.prepare('SELECT COALESCE(SUM(length(body)),0) AS bytes FROM files').get().bytes
      for (const row of db.prepare('SELECT path,length(body) AS bytes FROM files ORDER BY used').all()) {
        if (total + size <= maxBytes) break
        db.prepare('DELETE FROM files WHERE path=?').run(row.path); total -= row.bytes
      }
      db.prepare('INSERT INTO files VALUES(?,?,?,?,?,?,?)').run(path, body, type, etag, entry.upstream, entry.checked, entry.used)
      db.exec('COMMIT')
    } catch (e) { db.exec('ROLLBACK'); throw e }
    return entry
  }
  async function get(path) {
    if (closed) throw error(503, 'book_mirror_unavailable')
    if (!validMirrorPath(path)) throw error(404, 'not_found')
    if ((missing.get(path) ?? 0) > now()) throw error(404, 'book_not_found')
    const cached = db.prepare('SELECT * FROM files WHERE path=?').get(path)
    const age = cached ? now() - cached.checked : Infinity
    const ttl = immutable(path) ? 30 * 86400000 : 300000
    if (cached && age < ttl) {
      db.prepare('UPDATE files SET used=? WHERE path=?').run(now(), path)
      return { ...cached, stale: false }
    }
    if (!pending.has(path)) {
      const task = refresh(path, cached).catch(e => {
        if (cached && e.status !== 404 && age < ttl + 86400000) return { ...cached, stale: true }
        throw e
      }).finally(() => pending.delete(path))
      pending.set(path, task)
    }
    return pending.get(path)
  }
  return {
    get,
    async respond(req, res, path) {
      if (serving >= 8) throw error(503, 'book_mirror_busy')
      serving++
      try {
      const entry = await get(path)
      if (res.destroyed) return
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Expose-Headers', 'ETag, X-Bunko-Cache')
      res.setHeader('Content-Type', entry.type)
      res.setHeader('ETag', entry.etag)
      res.setHeader('Cache-Control', entry.stale ? 'public, max-age=30' : immutable(path) ? 'public, max-age=2592000, immutable' : 'public, max-age=300, must-revalidate')
      res.setHeader('X-Bunko-Cache', entry.stale ? 'stale' : 'ready')
      if (req.headers['if-none-match']?.split(',').map(v => v.trim()).includes(entry.etag)) { res.writeHead(304); res.end(); return }
      res.setHeader('Content-Length', entry.body.length)
      res.writeHead(200)
      res.setTimeout(30000, () => res.destroy())
      await new Promise(resolve => {
        const done = () => { res.off('close', done); resolve() }
        res.once('close', done)
        res.end(req.method === 'HEAD' ? undefined : entry.body, done)
      })
      } finally { serving-- }
    },
    async close() { closed = true; await Promise.allSettled([...pending.values()]); db.close() },
  }
}
