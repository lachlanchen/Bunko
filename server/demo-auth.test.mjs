import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes, createHash, scryptSync, generateKeyPairSync } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { request as httpRequest } from 'node:http'
import { createService } from './service.mjs'

const opaque = () => randomBytes(32).toString('base64url')
const sha = text => createHash('sha256').update(text).digest('base64url')
const password = 'a-long-fixture-password-not-a-real-credential'
const salt = opaque()
const demoAccount = { enabled: true, username: 'bunko-review', salt, passwordHash: scryptSync(password, salt, 32).toString('base64url') }
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
const config = { publicUrl: 'https://llm.lazying.art/bunko', encryptionKey: randomBytes(32).toString('base64'), demoAccount, appId: 123, appPrivateKey: privateKey, agent: { enabled: true } }
const passage = 'sample/c001.json/p1/2'

async function setup(t, overrides = {}, database = ':memory:') {
  let now = Date.now(), issue = null, comments = [], writes = 0
  const permissions = [], calls = []
  const server = createService({ ...config, ...overrides }, { database, now: () => now, fetchImpl: async (url, opts) => {
    calls.push(url)
    if (url.endsWith('/installation')) return Response.json({ id: 1234 })
    if (url.endsWith('/access_tokens')) {
      const body = JSON.parse(opts.body)
      assert.deepEqual(body.repository_ids, [1381952467])
      assert.deepEqual(Object.keys(body.permissions), ['issues'])
      permissions.push(body.permissions.issues)
      return Response.json({ token: `fixture-${body.permissions.issues}`, expires_at: new Date(now + 3600000).toISOString() })
    }
    if (opts.method === 'POST') {
      writes++
      assert.equal(opts.headers.Authorization, 'Bearer fixture-write')
      const body = JSON.parse(opts.body)
      assert.match(body.body, /\*\*Bunko demo account\*\* · Posted through Bunko/)
      if (url.endsWith('/comments')) {
        const comment = { id: 101, ...body, user: { id: 90, login: 'bunko-app[bot]' } }; comments.push(comment); return Response.json(comment)
      }
      assert.equal(url, 'https://api.github.com/repos/lachlanchen/bunko-books/issues')
      issue = { id: 100, number: 10, ...body, user: { id: 90, login: 'bunko-app[bot]' } }; return Response.json(issue)
    }
    assert.equal(opts.headers.Authorization, 'Bearer fixture-read')
    if (url.includes('/search/issues?')) return Response.json({ items: issue ? [issue] : [] })
    if (url.includes('/comments?')) return Response.json(comments)
    if (url.endsWith('/issues/10')) return Response.json(issue)
    throw new Error('Unexpected provider request')
  } })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  let closed = false
  const close = async () => { if (closed) return; closed = true; await new Promise(resolve => { server.close(resolve); server.closeAllConnections() }) }
  t.after(close)
  const request = (path, body = {}, token, headers = {}) => new Promise((resolve, reject) => {
    const req = httpRequest(`http://127.0.0.1:${server.address().port}/bunko${path}`, { method: 'POST', headers: { Host: 'llm.lazying.art', Origin: 'https://lachlan.lazying.art', 'Content-Type': 'application/json', 'X-Bunko-Client': '1', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers } }, response => {
      let text = ''; response.setEncoding('utf8'); response.on('data', chunk => { text += chunk })
      response.on('end', () => resolve({ status: response.statusCode, headers: new Headers(Object.entries(response.headers).map(([key, value]) => [key, Array.isArray(value) ? value.join('; ') : value])), body: JSON.parse(text) }))
    })
    req.on('error', reject); req.end(JSON.stringify(body))
  })
  const login = async (storage = 'secure') => {
    const verifier = opaque()
    const started = await request('/v1/auth/demo', { username: demoAccount.username, password, challenge: sha(verifier), platform: storage === 'cookie' ? 'web' : 'native', storage })
    assert.equal(started.status, 200)
    assert.equal(started.headers.get('set-cookie'), null)
    const flow = { flow: started.body.flow, verifier }
    const complete = await request('/v1/auth/complete', flow)
    assert.equal(complete.status, 200)
    return { ...complete, flow }
  }
  return { request, login, close, calls, permissions, writes: () => writes, advance: ms => { now += ms } }
}

test('demo login needs no provider, survives eight hours, restores and revokes independently', async t => {
  const s = await setup(t), login = await s.login(), token = login.body.token
  assert.deepEqual(login.body.user, { id: -1, login: 'Bunko demo', kind: 'demo' })
  assert.ok(!JSON.stringify(login.body).includes(password))
  assert.equal((await s.request('/v1/auth/complete', { ...login.flow, verifier: opaque() })).status, 403)
  assert.deepEqual((await s.request('/v1/auth/complete', login.flow)).body, login.body)
  s.advance(8 * 3600000 + 1)
  assert.equal((await s.request('/v1/session', {}, token)).status, 200)
  assert.equal(s.calls.length, 0)
  await s.request('/v1/logout', {}, token)
  assert.equal((await s.request('/v1/session', {}, token)).status, 401)
  const again = await s.login(); s.advance(90 * 86400000 + 1)
  assert.equal((await s.request('/v1/session', {}, again.body.token)).status, 401)
})

test('demo can create and reply to actual GitHub threads with explicit attribution and idempotency', async t => {
  const s = await setup(t), { body: { token } } = await s.login()
  await s.request('/v1/discussions/read', { passage })
  assert.deepEqual(s.permissions, ['read'])
  const input = { passage, body: 'A question about this passage.', excerpt: 'A passage.', requestId: opaque() }
  const posted = await s.request('/v1/discussions/post', input, token)
  assert.equal(posted.status, 200)
  assert.match(posted.body.issue.body, /Bunko demo account/)
  assert.deepEqual((await s.request('/v1/discussions/post', input, token)).body, posted.body)
  const reply = await s.request('/v1/discussions/post', { ...input, body: 'A reply.', requestId: opaque() }, token)
  assert.equal(reply.status, 200)
  assert.match(reply.body.comment.body, /Bunko demo account/)
  assert.equal(s.writes(), 2)
  assert.deepEqual(s.permissions, ['read', 'write'])
  const read = await s.request('/v1/discussions/read', { passage })
  assert.equal(read.body.comments.length, 1)
  assert.equal((await s.request('/v1/discussions/post', { ...input, requestId: opaque() })).status, 401)
  assert.ok(s.calls.every(url => !url.includes('/login/') && !url.endsWith('/user')))
})

test('web demo uses HttpOnly cookies, same-site boundaries, and no browser-storage token', async t => {
  const s = await setup(t), login = await s.login('cookie')
  assert.equal(login.body.token, undefined)
  const cookie = login.headers.get('set-cookie')
  assert.match(cookie, /HttpOnly; Secure; SameSite=Lax/)
  assert.equal((await s.request('/v1/session', {}, null, { Cookie: cookie })).status, 200)
  assert.equal((await s.request('/v1/session', {}, null, { Cookie: cookie, Origin: 'capacitor://localhost' })).status, 401)
  assert.equal((await s.request('/v1/auth/demo', {}, null, { Origin: 'https://evil.example' })).status, 403)
  await s.request('/v1/logout', {}, null, { Cookie: cookie })
  assert.equal((await s.request('/v1/auth/complete', login.flow)).status, 410)
})

test('demo is disabled by default, validates credentials, and limits guessing', async t => {
  const disabled = await setup(t, { demoAccount: undefined })
  assert.equal((await disabled.request('/v1/auth/demo')).body.error, 'demo_unavailable')
  const s = await setup(t)
  const input = { username: demoAccount.username, password: 'wrong', challenge: opaque(), platform: 'native', storage: 'secure' }
  for (let i = 0; i < 8; i++) assert.equal((await s.request('/v1/auth/demo', input)).body.error, 'invalid_demo_credentials')
  assert.equal((await s.request('/v1/auth/demo', { ...input, password })).status, 429)
  s.advance(900001)
  assert.equal((await s.request('/v1/auth/demo', { ...input, username: 'wrong-name', password })).body.error, 'invalid_demo_credentials')
  assert.equal((await s.request('/v1/auth/demo', { ...input, storage: 'cookie' })).status, 400)
  assert.equal(s.calls.length, 0)
})

test('credential rotation or disabling revokes persisted demo sessions and pending completions', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'bunko-demo-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const database = join(directory, 'state.sqlite')
  const s = await setup(t, {}, database), login = await s.login(), dormant = await s.login()
  await s.close()
  const changed = await setup(t, { demoAccount: { ...demoAccount, passwordHash: opaque() } }, database)
  assert.equal((await changed.request('/v1/auth/complete', login.flow)).status, 410)
  assert.equal((await changed.request('/v1/session', {}, login.body.token)).status, 401)
  await changed.close()
  const reset = await setup(t, {}, database)
  assert.equal((await reset.request('/v1/session', {}, dormant.body.token)).status, 401)
  assert.equal((await reset.request('/v1/auth/complete', dormant.flow)).status, 410)
  const fresh = await reset.login(); await reset.close()
  const disabled = await setup(t, { demoAccount: undefined }, database)
  await disabled.close()
  const reenabled = await setup(t, {}, database)
  assert.equal((await reenabled.request('/v1/session', {}, fresh.body.token)).status, 401)
})
