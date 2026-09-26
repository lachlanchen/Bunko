import { test } from 'node:test'
import { request as httpRequest } from 'node:http'
import assert from 'node:assert/strict'
import { randomBytes, createHash } from 'node:crypto'
import { createService } from './service.mjs'
const opaque = () => randomBytes(32).toString('base64url')
const sha = value => createHash('sha256').update(value).digest('base64url')
const key = 'sample/c001.json/p1/2'
const config = { publicUrl: 'https://llm.lazying.art/bunko', clientId: 'fixture-client', clientSecret: 'fixture-secret', encryptionKey: randomBytes(32).toString('base64') }
const user = { id: 7, login: 'reader' }
async function setup(t, custom) {
  let time = Date.now(), writes = 0, issue = null, comments = [], tokenRequest
  const fetchImpl = async (url, options) => {
    if (custom) { const result = await custom(url, options); if (result) return result }
    if (url.endsWith('/login/oauth/access_token')) { tokenRequest = JSON.parse(options.body); return Response.json({ access_token: 'fixture-user-token', expires_in: 28800 }) }
    if (url.endsWith('/user')) return Response.json(user)
    if (url.includes('/search/issues?')) return Response.json({ items: issue ? [issue] : [] })
    if (options.method === 'POST') {
      writes++
      if (url.endsWith('/comments')) { const comment = { id: 99, body: JSON.parse(options.body).body, user }; comments.push(comment); return Response.json(comment) }
      issue = { id: 80, number: 12, ...JSON.parse(options.body), user, html_url: 'https://github.com/lachlanchen/bunko-books/issues/12' }; return Response.json(issue)
    }
    if (url.includes('/comments?')) return Response.json(comments)
    if (url.endsWith('/issues/12')) return Response.json(issue)
    throw new Error('Unexpected fixture path')
  }
  const server = createService(config, { fetchImpl, now: () => time })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections() }))
  const root = `http://127.0.0.1:${server.address().port}`
  async function request(path, body, token, headers = {}) {
    return new Promise((resolve, reject) => {
      const req = httpRequest(root + '/bunko' + path, { method: body ? 'POST' : 'GET', headers: { Host: 'llm.lazying.art', Origin: 'https://lachlan.lazying.art', 'Content-Type': 'application/json', 'X-Bunko-Client': '1', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers } }, response => {
        let text = ''; response.setEncoding('utf8'); response.on('data', chunk => { text += chunk })
        response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: response.headers['content-type']?.startsWith('application/json') ? JSON.parse(text) : text }))
      })
      req.on('error', reject); req.end(body ? JSON.stringify(body) : undefined)
    })
  }
  async function start(platform = 'web', storage) {
    const verifier = opaque(), started = await request('/v1/auth/start', { challenge: sha(verifier), platform, storage })
    assert.equal(started.status, 200)
    return { verifier, ...started.body, state: new URL(started.body.url).searchParams.get('state') }
  }
  async function login() {
    const flow = await start()
    assert.equal((await request(`/oauth/callback?code=fixture-code&state=${flow.state}`)).status, 200)
    const result = await request('/v1/auth/complete', { flow: flow.flow, verifier: flow.verifier })
    assert.equal(result.status, 200)
    return result.body.token
  }
  return { request, start, login, advance: ms => { time += ms }, writes: () => writes, tokenRequest: () => tokenRequest }
}

test('PKCE, state replay, verifier binding, token isolation, and recoverable completion', async t => {
  const s = await setup(t), flow = await s.start('native')
  assert.equal(new URL(flow.url).searchParams.get('code_challenge_method'), 'S256')
  assert.equal((await s.request('/v1/auth/complete', { flow: flow.flow, verifier: opaque() })).status, 403)
  assert.equal((await s.request('/v1/auth/complete', { flow: flow.flow, verifier: flow.verifier })).body.pending, true)
  const callback = `/oauth/callback?code=fixture-code&state=${flow.state}`
  const page = await s.request(callback)
  assert.match(page.body, /art.lazying.bunko:\/\/oauth\/complete/)
  assert.ok(!page.body.includes('fixture-user-token'))
  assert.equal(s.tokenRequest().repository_id, 1381952467)
  assert.equal((await s.request(callback)).status, 400)
  const completed = await s.request('/v1/auth/complete', { flow: flow.flow, verifier: flow.verifier })
  assert.deepEqual(completed.body.user, user)
  assert.ok(!JSON.stringify(completed.body).includes('fixture-user-token'))
  assert.deepEqual((await s.request('/v1/auth/complete', { flow: flow.flow, verifier: flow.verifier })).body, completed.body)
  assert.equal((await s.request('/v1/session', {}, completed.body.token)).status, 200)
  await s.request('/v1/logout', {}, completed.body.token)
  assert.equal((await s.request('/v1/session', {}, completed.body.token)).status, 401)
})

test('expiry, cancelled authorization, exact routes, origin and authorization boundaries', async t => {
  const s = await setup(t), flow = await s.start()
  assert.equal((await s.request('/v1/session', {})).status, 401)
  assert.equal((await s.request('/v1/auth/start', { challenge: opaque(), platform: 'evil' })).status, 400)
  assert.equal((await s.request('/v1/session', {}, null, { Origin: 'https://evil.example' })).status, 403)
  assert.equal((await s.request('/healthz', null, null, { Host: 'evil.example' })).status, 404)
  assert.equal((await s.request('/v1/session?x=1', {})).status, 404)
  assert.equal((await s.request('/v1%2fsession', {})).status, 404)
  assert.equal((await s.request('/v1/session')).status, 405)
  assert.equal((await s.request('/v1/discussions/read', { passage: 'sample/../../evil', page: 1 })).status, 400)
  assert.equal((await s.request('/v1/discussions/read', { passage: key, page: -1 })).status, 400)
  await s.request(`/oauth/callback?error=access_denied&state=${flow.state}`)
  assert.equal((await s.request('/v1/auth/complete', { flow: flow.flow, verifier: flow.verifier })).body.error, 'authorization_cancelled')
  const expired = await s.start(); s.advance(600001)
  assert.equal((await s.request('/v1/auth/complete', { flow: expired.flow, verifier: expired.verifier })).status, 410)
  const token = await s.login(); s.advance(8 * 3600000 + 1)
  assert.equal((await s.request('/v1/session', {}, token)).status, 401)
})

test('create and reply as user, preserve exact passage, deduplicate repeated submissions', async t => {
  const s = await setup(t), token = await s.login()
  const input = { passage: key, excerpt: 'A passage.', body: 'A thoughtful question.', requestId: opaque() }
  const created = await s.request('/v1/discussions/post', input, token)
  assert.equal(created.status, 200)
  assert.equal(created.body.issue.number, 12)
  assert.ok(!created.body.issue.body.includes('bunko-post'))
  assert.deepEqual((await s.request('/v1/discussions/post', input, token)).body, created.body)
  assert.equal(s.writes(), 1)
  assert.equal((await s.request('/v1/discussions/post', { ...input, body: 'Changed' }, token)).status, 409)
  const reply = await s.request('/v1/discussions/post', { ...input, body: 'A reply.', requestId: opaque() }, token)
  assert.equal(reply.body.comment.body, 'A reply.')
  assert.equal(s.writes(), 2)
  const read = await s.request('/v1/discussions/read', { passage: key })
  assert.equal(read.body.comments.length, 1)
  assert.equal(read.body.nextPage, null)
})

test('ambiguous network write never silently retries a public comment', async t => {
  let attempts = 0
  const s = await setup(t, async (url, opts) => { if (url.endsWith('/issues') && opts.method === 'POST') { attempts++; throw new Error('network interrupted after write') } })
  const token = await s.login(), input = { passage: key, excerpt: 'Text', body: 'Question', requestId: opaque() }
  assert.equal((await s.request('/v1/discussions/post', input, token)).body.error, 'post_uncertain')
  assert.equal((await s.request('/v1/discussions/post', input, token)).body.error, 'post_uncertain')
  assert.equal(attempts, 1)
})

test('anonymous readers use a cached repository-limited read-only installation token', async t => {
  const { generateKeyPairSync } = await import('node:crypto')
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
  let issued = 0
  const fetchImpl = async (url, opts) => {
    if (url.endsWith('/installation')) return Response.json({ id: 44 })
    if (url.endsWith('/access_tokens')) {
      issued++
      assert.deepEqual(JSON.parse(opts.body), { repository_ids: [1381952467], permissions: { issues: 'read' } })
      return Response.json({ token: 'fixture-installation-token', expires_at: new Date(Date.now() + 3600000).toISOString() })
    }
    assert.match(url, /\/search\/issues\?/)
    assert.equal(opts.headers.Authorization, 'Bearer fixture-installation-token')
    return Response.json({ items: [] })
  }
  const server = createService({ ...config, appId: 123, appPrivateKey: privateKey }, { fetchImpl })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections() }))
  for (const passage of [key, 'sample/c001.json/p2/2']) {
    await new Promise((resolve, reject) => {
      const req = httpRequest({ hostname: '127.0.0.1', port: server.address().port, path: '/bunko/v1/discussions/read', method: 'POST', headers: { Host: 'llm.lazying.art', Origin: 'https://lachlan.lazying.art', 'X-Bunko-Client': '1', 'Content-Type': 'application/json' } }, response => {
        assert.equal(response.statusCode, 200); response.resume(); response.on('end', resolve)
      })
      req.on('error', reject); req.end(JSON.stringify({ passage }))
    })
  }
  assert.equal(issued, 1)
})

test('persistent sessions rotate GitHub tokens once, survive eight hours, and revoke on logout', async t => {
  let refreshed = 0
  const s = await setup(t, async (url, opts) => {
    if (url.endsWith('/login/oauth/access_token')) {
      const input = JSON.parse(opts.body)
      if (input.grant_type === 'refresh_token') { refreshed++; assert.equal(input.refresh_token, 'fixture-refresh'); await new Promise(resolve => setTimeout(resolve, 10)) }
      return Response.json({ access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 28800, refresh_token_expires_in: 15897600 })
    }
  })
  const flow = await s.start('native', 'secure')
  await s.request(`/oauth/callback?code=fixture&state=${flow.state}`)
  const complete = await s.request('/v1/auth/complete', { flow: flow.flow, verifier: flow.verifier })
  assert.ok(!JSON.stringify(complete.body).includes('fixture-refresh'))
  const token = complete.body.token
  s.advance(8 * 3600000 + 1)
  const results = await Promise.all([s.request('/v1/session', {}, token), s.request('/v1/session', {}, token)])
  assert.ok(results.every(r => r.status === 200))
  assert.equal(refreshed, 1)
  await s.request('/v1/logout', {}, token)
  assert.equal((await s.request('/v1/session', {}, token)).status, 401)
})

test('web persistence is HttpOnly, verifier-bound, same-origin and cleared on logout', async t => {
  const s = await setup(t, async url => url.endsWith('/login/oauth/access_token') ? Response.json({ access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 28800, refresh_token_expires_in: 15897600 }) : null)
  const flow = await s.start('web', 'cookie')
  await s.request(`/oauth/callback?code=fixture&state=${flow.state}`)
  const complete = await s.request('/v1/auth/complete', { flow: flow.flow, verifier: flow.verifier })
  assert.equal(complete.body.token, undefined)
  const cookie = complete.headers['set-cookie'][0]
  assert.match(cookie, /HttpOnly; Secure; SameSite=Lax/)
  assert.equal((await s.request('/v1/session', {}, null, { Cookie: cookie })).status, 200)
  assert.equal((await s.request('/v1/session', {}, null, { Cookie: cookie, Origin: 'capacitor://localhost' })).status, 401)
  assert.equal((await s.request('/v1/auth/complete', { flow: flow.flow, verifier: opaque() })).status, 403)
  const logout = await s.request('/v1/logout', {}, null, { Cookie: cookie })
  assert.match(logout.headers['set-cookie'][0], /Max-Age=0/)
  assert.equal((await s.request('/v1/session', {}, null, { Cookie: cookie })).status, 401)
  assert.equal((await s.request('/v1/auth/complete', { flow: flow.flow, verifier: flow.verifier })).status, 410)
})

test('persistent sessions expire after ninety days without use', async t => {
  const s = await setup(t, async url => url.endsWith('/login/oauth/access_token') ? Response.json({ access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 28800, refresh_token_expires_in: 15897600 }) : null)
  const flow = await s.start('native', 'secure')
  await s.request(`/oauth/callback?code=fixture&state=${flow.state}`)
  const complete = await s.request('/v1/auth/complete', { flow: flow.flow, verifier: flow.verifier })
  s.advance(90 * 86400000 + 1)
  assert.equal((await s.request('/v1/session', {}, complete.body.token)).status, 401)
})
