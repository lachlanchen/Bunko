import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createBookMirror } from './book-mirror.mjs'
import { createService } from './service.mjs'
import { request } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('the disk cache survives restart and evicts old payloads within its byte budget', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'bunko-mirror-')), calls = []
  const options = { database: join(dir, 'cache.sqlite'), maxBytes: 32 * 1024 ** 2, fetchImpl: async url => { calls.push(url); return Response.json('x'.repeat(12 * 1024 ** 2)) } }
  let mirror = createBookMirror(options)
  t.after(async () => { await mirror.close(); rmSync(dir, { recursive: true, force: true }) })
  await mirror.get('books/test/c0001-abcdef.json')
  await mirror.get('books/test/c0002-abcdef.json')
  await mirror.close(); mirror = createBookMirror(options)
  await mirror.get('books/test/c0002-abcdef.json')
  assert.equal(calls.length, 2)
  await mirror.get('books/test/c0003-abcdef.json')
  await mirror.get('books/test/c0001-abcdef.json')
  assert.equal(calls.length, 4)
})

test('concurrent misses share one fetch; immutable cache survives origin failure', async t => {
  let calls = 0, resolve
  const mirror = createBookMirror({ fetchImpl: async () => { calls++; return new Promise(r => { resolve = r }) } })
  t.after(() => mirror.close())
  const a = mirror.get('books/test/c0001-abcdef.json'), b = mirror.get('books/test/c0001-abcdef.json')
  resolve(Response.json({ real: true }))
  assert.equal((await a).etag, (await b).etag)
  assert.equal((await mirror.get('books/test/c0001-abcdef.json')).body.length, 13)
  assert.equal(calls, 1)
})

test('mutable catalog revalidates conditionally, has bounded stale fallback, and removes 404 content', async t => {
  let time = 0, calls = 0, mode = 'ok'
  const mirror = createBookMirror({ now: () => time, fetchImpl: async (_url, options) => {
    calls++
    if (calls > 1) assert.equal(options.headers['If-None-Match'], '"upstream"')
    if (mode === 'same') return new Response(null, { status: 304 })
    if (mode === 'down') throw new Error('offline')
    if (mode === 'gone') return new Response(null, { status: 404 })
    return Response.json({ revision: 1 }, { headers: { ETag: '"upstream"' } })
  } })
  t.after(() => mirror.close())
  await mirror.get('reader-index.json')
  time += 300001; mode = 'same'
  assert.equal((await mirror.get('reader-index.json')).stale, false)
  time += 300001; mode = 'down'
  assert.equal((await mirror.get('reader-index.json')).stale, true)
  time += 86400001
  await assert.rejects(mirror.get('reader-index.json'), /offline/)
  mode = 'gone'
  await assert.rejects(mirror.get('reader-index.json'), { status: 404 })
  const previous = calls
  await assert.rejects(mirror.get('reader-index.json'), { status: 404 })
  assert.equal(calls, previous)
})

test('only allowed repository files are fetched; HTML images and oversized bodies are rejected', async t => {
  let calls = 0, big = false
  const mirror = createBookMirror({ fetchImpl: async url => {
    calls++; assert.ok(url.startsWith('https://raw.githubusercontent.com/lachlanchen/bunko-books/main/'))
    return new Response('<html>proxy</html>', { headers: big ? { 'Content-Length': String(33 * 1024 ** 2) } : {} })
  } })
  t.after(() => mirror.close())
  for (const path of ['../config.json', 'books/x/assets/%2e%2e/x.png', 'https://example.org/file', 'books/x/a.svg']) await assert.rejects(mirror.get(path), { status: 404 })
  assert.equal(calls, 0)
  await assert.rejects(mirror.get('books/x/cover-abcd.webp'), { status: 502 })
  big = true
  await assert.rejects(mirror.get('reader-index.json'), /book_too_large/)
})

test('public mirror uses CORS without sessions, supports conditional GET and HEAD, and keeps private routes protected', async t => {
  let calls = 0
  const server = createService({ publicUrl: 'https://llm.lazying.art/bunko', encryptionKey: Buffer.alloc(32).toString('base64'), bookMirror: { enabled: true } }, { fetchImpl: async () => { calls++; return Response.json({ schema: 1, books: [] }) } })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections() }))
  const send = (path, method = 'GET', headers = {}) => new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port: server.address().port, path: '/bunko/' + path, method, headers: { Host: 'llm.lazying.art', Origin: 'https://reader.example', ...headers } }, res => {
      let body = ''; res.on('data', data => { body += data }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
    }); req.on('error', reject); req.end()
  })
  const first = await send('books-cache/reader-index.json')
  assert.equal(first.status, 200)
  assert.equal(first.headers['access-control-allow-origin'], '*')
  assert.equal(first.headers['access-control-allow-credentials'], undefined)
  assert.equal(first.headers['set-cookie'], undefined)
  assert.equal((await send('books-cache/reader-index.json', 'GET', { 'If-None-Match': first.headers.etag })).status, 304)
  assert.equal((await send('books-cache/reader-index.json', 'HEAD')).body, '')
  assert.equal((await send('v1/session', 'POST')).status, 403)
  assert.equal((await send('books-cache/reader-index.json?url=evil')).status, 404)
  assert.equal(calls, 1)
})
