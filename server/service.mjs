import { createServer } from 'node:http'
import { randomBytes, createHash, createCipheriv, createDecipheriv, timingSafeEqual, createSign } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, lstatSync, realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const REPO = 'lachlanchen/bunko-books'
const REPO_ID = 1381952467
const PREFIX = '/bunko'
const SESSION_MS = 8 * 60 * 60 * 1000
const PERSISTENT_MS = 90 * 86400000
const COOKIE = '__Host-bunko'
const FLOW_MS = 10 * 60 * 1000
const opaque = () => randomBytes(32).toString('base64url')
const hash = value => createHash('sha256').update(value).digest('base64url')
const fail = (status, code) => { throw Object.assign(new Error(code), { status, code }) }
const validOpaque = value => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))
const safeUser = user => ({ id: user.id, login: user.login })
const safeComment = comment => ({ id: comment.id, body: String(comment.body ?? '').replace(/\n?<!-- bunko-post:[a-zA-Z0-9_-]+ -->/g, ''), user: safeUser(comment.user ?? {}), html_url: comment.html_url, created_at: comment.created_at })
const safeIssue = issue => issue ? { ...safeComment(issue), number: issue.number, locked: !!issue.locked } : null
const title = key => `[Passage] ${key}`
const matches = (issue, key) => !issue.pull_request && issue.title === title(key) && (issue.body ?? '').split('\n').includes(`Passage: ${key}`)
function passage(value) {
  if (typeof value !== 'string' || value.length > 220 || !/^[A-Za-z0-9_.\/-]+$/.test(value) || value.includes('..') || value.split('/').length !== 4) fail(400, 'invalid_passage')
  return value
}

export function createService(config, { fetchImpl = fetch, now = Date.now, database = ':memory:' } = {}) {
  const base = new URL(config.publicUrl)
  if (base.protocol !== 'https:' || base.pathname !== PREFIX || base.search || base.hash) throw new Error('Invalid publicUrl')
  const origins = new Set(config.origins ?? ['https://lachlan.lazying.art', 'https://lachlanchen.github.io', 'capacitor://localhost', 'https://localhost', 'bunko://localhost', 'null'])
  const key = Buffer.from(config.encryptionKey, 'base64')
  if (key.length !== 32) throw new Error('Expected 32-byte encryption key')
  const seal = value => {
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()])
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64')
  }
  const unseal = value => {
    const bytes = Buffer.from(value, 'base64'), decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12))
    decipher.setAuthTag(bytes.subarray(12, 28))
    return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString())
  }
  const db = new DatabaseSync(database)
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA secure_delete=ON;
    CREATE TABLE IF NOT EXISTS flows (id TEXT PRIMARY KEY, state TEXT UNIQUE, data TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, data TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS threads (passage TEXT PRIMARY KEY, issue INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, result TEXT, expires INTEGER NOT NULL);`)
  const cleanup = () => {
    for (const table of ['flows', 'sessions', 'posts']) db.prepare(`DELETE FROM ${table} WHERE expires < ?`).run(now())
  }
  const limits = new Map(), cache = new Map(), locks = new Map()
  let active = 0
  function limit(id, max, duration) {
    const row = limits.get(id)
    if (row && row.until > now()) { if (row.count++ >= max) fail(429, 'rate_limited'); return }
    if (limits.size > 10000) for (const [k, v] of limits) if (v.until <= now()) limits.delete(k)
    if (limits.size > 12000) fail(503, 'busy')
    limits.set(id, { until: now() + duration, count: 1 })
  }
  async function github(path, token, body) {
    const response = await fetchImpl(`https://api.github.com${path}`, {
      method: body ? 'POST' : 'GET', headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Bunko-Discussions', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(12000), redirect: 'error',
    })
    if (!response.ok) fail(response.status === 401 ? 401 : response.status === 403 || response.status === 429 ? 429 : response.status === 422 ? 422 : 502, response.status === 401 ? 'sign_in_again' : response.status === 403 || response.status === 429 ? 'github_limited' : 'github_unavailable')
    return response.json()
  }
  let readAccess = null, readAccessPending = null
  async function publicReadToken() {
    if (!config.appId || !config.appPrivateKey) return undefined
    if (readAccess?.expires > now()) return readAccess.token
    if (readAccessPending) return readAccessPending
    readAccessPending = (async () => {
      const encoded = value => Buffer.from(JSON.stringify(value)).toString('base64url')
      const seconds = Math.floor(now() / 1000)
      const payload = `${encoded({ alg: 'RS256', typ: 'JWT' })}.${encoded({ iat: seconds - 60, exp: seconds + 540, iss: String(config.appId) })}`
      const signer = createSign('RSA-SHA256'); signer.update(payload)
      const jwt = `${payload}.${signer.sign(config.appPrivateKey, 'base64url')}`
      const installation = await github(`/repos/${REPO}/installation`, jwt)
      if (!Number.isSafeInteger(installation.id)) fail(502, 'github_unavailable')
      const result = await github(`/app/installations/${installation.id}/access_tokens`, jwt, { repository_ids: [REPO_ID], permissions: { issues: 'read' } })
      const expires = Date.parse(result.expires_at) - 60000
      if (typeof result.token !== 'string' || !Number.isFinite(expires) || expires <= now()) fail(502, 'github_unavailable')
      readAccess = { token: result.token, expires }
      return result.token
    })().finally(() => { readAccessPending = null })
    return readAccessPending
  }
  async function findThread(key, token) {
    const saved = db.prepare('SELECT issue FROM threads WHERE passage=?').get(key)
    if (saved) {
      const issue = await github(`/repos/${REPO}/issues/${saved.issue}`, token)
      if (matches(issue, key)) return issue
      db.prepare('DELETE FROM threads WHERE passage=?').run(key)
    }
    const query = new URLSearchParams({ q: `repo:${REPO} is:issue in:title "${title(key)}"`, per_page: '100' })
    const found = (await github(`/search/issues?${query}`, token)).items?.find(i => matches(i, key))
    if (found) db.prepare('INSERT OR REPLACE INTO threads VALUES (?,?)').run(key, found.number)
    return found ?? null
  }
  const refreshing = new Map()
  function cookie(res, value, expires = 0) {
    res.setHeader('Set-Cookie', `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(0, Math.floor((expires - now()) / 1000))}`)
  }
  function credential(req) {
    const bearer = req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1]
    // Cookies are accepted only from the canonical same-site web reader.
    const saved = req.headers.origin === 'https://lachlan.lazying.art' ? req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1) : null
    return bearer ?? (validOpaque(saved) ? saved : null)
  }
  async function session(req, res, refresh = true) {
    const value = credential(req)
    if (!value) fail(401, 'sign_in_again')
    const row = db.prepare('SELECT * FROM sessions WHERE id=? AND expires>?').get(hash(value), now())
    if (!row) fail(401, 'sign_in_again')
    if (refreshing.has(row.id)) await refreshing.get(row.id)
    const latest = db.prepare('SELECT * FROM sessions WHERE id=? AND expires>?').get(row.id, now())
    if (!latest) fail(401, 'sign_in_again')
    let auth = unseal(latest.data)
    if (refresh && (auth.accessExpires ?? auth.expires) <= now() + 60000) {
      if (!auth.refreshToken || auth.refreshExpires <= now()) { db.prepare('DELETE FROM sessions WHERE id=?').run(row.id); fail(401, 'sign_in_again') }
      const pending = (async () => {
        const response = await fetchImpl('https://github.com/login/oauth/access_token', {
          method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, grant_type: 'refresh_token', refresh_token: auth.refreshToken }),
          signal: AbortSignal.timeout(12000), redirect: 'error',
        })
        const token = await response.json()
        if (token.error === 'bad_refresh_token' || response.status === 401) { db.prepare('DELETE FROM sessions WHERE id=?').run(row.id); fail(401, 'sign_in_again') }
        if (!response.ok || !token.access_token || !token.refresh_token) fail(503, 'temporarily_unavailable')
        auth = { ...auth, token: token.access_token, refreshToken: token.refresh_token, accessExpires: now() + Math.min(SESSION_MS, token.expires_in * 1000), refreshExpires: now() + token.refresh_token_expires_in * 1000 }
        // Logout during a refresh must not resurrect a deleted session.
        db.prepare('UPDATE sessions SET data=? WHERE id=?').run(seal(auth), row.id)
      })()
      refreshing.set(row.id, pending)
      try { await pending } finally { refreshing.delete(row.id) }
    }
    if (!db.prepare('SELECT id FROM sessions WHERE id=?').get(row.id)) fail(401, 'sign_in_again')
    const expires = auth.persistent ? Math.min(now() + PERSISTENT_MS, auth.refreshExpires) : row.expires
    db.prepare('UPDATE sessions SET expires=? WHERE id=?').run(expires, row.id)
    if (auth.storage === 'cookie' && res) cookie(res, value, expires)
    return { ...auth, expires, sessionId: row.id }
  }
  async function body(req) {
    if (req.headers['content-type'] !== 'application/json') fail(415, 'json_required')
    const chunks = []; let length = 0
    for await (const chunk of req) {
      length += chunk.length
      if (length > 18000) fail(413, 'too_large')
      chunks.push(chunk)
    }
    try { const value = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!value || Array.isArray(value) || typeof value !== 'object') fail(400, 'invalid_json'); return value } catch { fail(400, 'invalid_json') }
  }
  function json(res, value, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)) }
  function callbackPage(res, platform, id, error = false) {
    // The flow ID is not a credential: completing it requires the app's original verifier.
    const target = platform === 'native' ? `art.lazying.bunko://oauth/complete?flow=${id}` : null
    const nonce = opaque()
    res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Bunko · GitHub</title><style nonce="${nonce}">body{font:18px system-ui;background:#faf7f0;color:#272942;max-width:32rem;margin:15vh auto;padding:2rem;line-height:1.7}a{color:#403d78}</style><h1>Bunko · 文庫</h1><p>${error ? 'Sign-in was not completed. Return to Bunko and try again.' : 'Signed in. Return to Bunko to continue your conversation.'}</p>${target ? `<a href="${target}">Return to Bunko</a><script nonce="${nonce}">location.replace(${JSON.stringify(target)})</script>` : `<script nonce="${nonce}">window.close()</script>`}</html>`)
  }
  const postPaths = ['/v1/auth/start', '/v1/auth/complete', '/v1/session', '/v1/logout', '/v1/discussions/read', '/v1/discussions/post'].map(p => PREFIX + p)
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Vary', 'Origin')
    let counted = false
    try {
      if (req.headers.host !== base.host) fail(404, 'not_found')
      if (active >= 40) fail(503, 'busy')
      active++; counted = true
      const raw = req.url ?? '', path = raw.split('?')[0]
      if (path !== `${PREFIX}/oauth/callback` && raw !== path) fail(404, 'not_found')
      if (!postPaths.includes(path) && ![`${PREFIX}/healthz`, `${PREFIX}/oauth/callback`].includes(path)) fail(404, 'not_found')
      const origin = req.headers.origin
      if (origin && !origins.has(origin)) fail(403, 'origin_denied')
      if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Access-Control-Allow-Credentials', 'true') }
      if (req.method === 'OPTIONS' && postPaths.includes(path)) {
        res.setHeader('Access-Control-Allow-Methods', 'POST')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Bunko-Client')
        res.writeHead(204); res.end(); return
      }
      if (req.method === 'GET' && path === `${PREFIX}/healthz`) { json(res, { service: 'bunko-discussions', ready: !!(config.clientId && config.clientSecret) }); return }
      const ip = req.headers['x-bunko-client-address'] ?? req.socket.remoteAddress
      limit(`request:${ip}`, 180, 60000)
      cleanup()
      if (req.method === 'GET' && path === `${PREFIX}/oauth/callback`) {
        const params = new URL(raw, base).searchParams, state = params.get('state')
        if (!validOpaque(state)) fail(400, 'invalid_state')
        const row = db.prepare('SELECT * FROM flows WHERE state=? AND expires>?').get(hash(state), now())
        if (!row) fail(400, 'expired_state')
        const flow = unseal(row.data)
        // Consume OAuth state before the network call; replay never exchanges the code twice.
        db.prepare('UPDATE flows SET state=NULL WHERE id=?').run(row.id)
        try {
          const code = params.get('code')
          if (params.has('error') || !code || code.length > 1024) fail(400, 'authorization_cancelled')
          const response = await fetchImpl('https://github.com/login/oauth/access_token', {
            method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: `${config.publicUrl}/oauth/callback`, code_verifier: flow.githubVerifier, repository_id: REPO_ID }),
            signal: AbortSignal.timeout(12000), redirect: 'error',
          })
          const token = await response.json()
          if (!response.ok || !token.access_token || token.error) fail(502, 'exchange_failed')
          const user = safeUser(await github('/user', token.access_token))
          if (!Number.isSafeInteger(user.id) || typeof user.login !== 'string') fail(502, 'invalid_user')
          const accessExpires = now() + Math.min(SESSION_MS, (token.expires_in ?? 28800) * 1000)
          const persistent = !!flow.storage && typeof token.refresh_token === 'string' && Number.isFinite(token.refresh_token_expires_in)
          flow.auth = { token: token.access_token, user, accessExpires, expires: accessExpires, persistent, storage: flow.storage,
            ...(persistent ? { refreshToken: token.refresh_token, refreshExpires: now() + token.refresh_token_expires_in * 1000 } : {}) }
          // Refresh tokens stay encrypted on the cloud; only Bunko's opaque session reaches native storage.
          delete flow.githubVerifier
          db.prepare('UPDATE flows SET data=? WHERE id=?').run(seal(flow), row.id)
          callbackPage(res, flow.platform, row.id)
        } catch {
          db.prepare('UPDATE flows SET data=? WHERE id=?').run(seal({ ...flow, error: true, githubVerifier: undefined }), row.id)
          callbackPage(res, flow.platform, row.id, true)
        }
        return
      }
      if (req.method !== 'POST' || !postPaths.includes(path)) fail(405, 'method_denied')
      if (!origin || req.headers['x-bunko-client'] !== '1') fail(403, 'origin_required')
      const input = await body(req)
      if (path === `${PREFIX}/v1/auth/start`) {
        if (!config.clientId || !config.clientSecret) fail(503, 'not_configured')
        limit(`start:${ip}`, 10, 600000)
        if (!validOpaque(input.challenge) || !['web', 'native'].includes(input.platform)) fail(400, 'invalid_flow')
        const storage = input.storage
        if (storage !== undefined && !['cookie', 'secure'].includes(storage)) fail(400, 'invalid_flow')
        if (storage === 'cookie' && (origin !== 'https://lachlan.lazying.art' || input.platform !== 'web')) fail(400, 'invalid_flow')
        if (storage === 'secure' && input.platform !== 'native') fail(400, 'invalid_flow')
        const id = opaque(), state = opaque(), verifier = opaque()
        db.prepare('INSERT INTO flows VALUES (?,?,?,?)').run(id, hash(state), seal({ challenge: input.challenge, platform: input.platform, storage, githubVerifier: verifier }), now() + FLOW_MS)
        json(res, { flow: id, url: `https://github.com/login/oauth/authorize?${new URLSearchParams({ client_id: config.clientId, redirect_uri: `${config.publicUrl}/oauth/callback`, state, code_challenge: hash(verifier), code_challenge_method: 'S256' })}` }); return
      }
      if (path === `${PREFIX}/v1/auth/complete`) {
        if (!validOpaque(input.flow) || !validOpaque(input.verifier)) fail(400, 'invalid_flow')
        const row = db.prepare('SELECT * FROM flows WHERE id=? AND expires>?').get(input.flow, now())
        if (!row) fail(410, 'flow_expired')
        const flow = unseal(row.data)
        if (!same(flow.challenge, hash(input.verifier))) fail(403, 'invalid_verifier')
        if (flow.completed) {
          if (!db.prepare('SELECT id FROM sessions WHERE id=? AND expires>?').get(hash(flow.completed.token), now())) fail(410, 'flow_expired')
          if (flow.storage === 'cookie') cookie(res, flow.completed.token, flow.completed.expires)
          json(res, { ...flow.completed, ...(flow.storage === 'cookie' ? { token: undefined } : {}) }); return
        }
        if (flow.error) { db.prepare('DELETE FROM flows WHERE id=?').run(row.id); fail(400, 'authorization_cancelled') }
        if (!flow.auth) { json(res, { pending: true }); return }
        const token = opaque()
        const expires = flow.auth.persistent ? Math.min(now() + PERSISTENT_MS, flow.auth.refreshExpires) : flow.auth.expires
        db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hash(token), seal(flow.auth), expires)
        const completed = { token, user: flow.auth.user, expires }
        // A lost completion response can be recovered with the same bound verifier.
        db.prepare('UPDATE flows SET data=?, expires=? WHERE id=?').run(seal({ challenge: flow.challenge, storage: flow.storage, completed }), now() + 60000, row.id)
        if (flow.storage === 'cookie') cookie(res, token, expires)
        json(res, { ...completed, ...(flow.storage === 'cookie' ? { token: undefined } : {}) }); return
      }
      if (path === `${PREFIX}/v1/discussions/read`) {
        const key = passage(input.passage), page = input.page ?? 1
        if (!Number.isSafeInteger(page) || page < 1 || page > 100) fail(400, 'invalid_page')
        const cacheKey = `${key}:${page}`, cached = cache.get(cacheKey)
        if (cached?.until > now()) { json(res, cached.value); return }
        const token = await publicReadToken()
        const issue = await findThread(key, token)
        const comments = issue ? await github(`/repos/${REPO}/issues/${issue.number}/comments?per_page=30&page=${page}`, token) : []
        const value = { issue: safeIssue(issue), comments: comments.map(safeComment), nextPage: comments.length === 30 ? page + 1 : null }
        if (cache.size >= 500) cache.delete(cache.keys().next().value)
        cache.set(cacheKey, { value, until: now() + 60000 }); json(res, value); return
      }
      if (path === `${PREFIX}/v1/logout`) {
        const value = credential(req)
        if (value) db.prepare('DELETE FROM sessions WHERE id=?').run(hash(value))
        cookie(res, ''); json(res, { ok: true }); return
      }
      const auth = await session(req, res)
      if (path === `${PREFIX}/v1/session`) {
        try { await github('/user', auth.token) } catch (error) {
          if (error.status === 401) { db.prepare('DELETE FROM sessions WHERE id=?').run(auth.sessionId); cookie(res, '') }
          throw error
        }
        json(res, { user: auth.user, expires: auth.expires }); return
      }
      if (path === `${PREFIX}/v1/discussions/post`) {
        const key = passage(input.passage)
        if (typeof input.body !== 'string' || !input.body.trim() || input.body.length > 5000 || typeof input.excerpt !== 'string' || input.excerpt.length > 500 || !validOpaque(input.requestId)) fail(400, 'invalid_comment')
        const id = hash(`${auth.user.id}:${input.requestId}`), fingerprint = hash(JSON.stringify([key, input.body, input.excerpt]))
        const previous = db.prepare('SELECT * FROM posts WHERE id=?').get(id)
        if (previous) {
          if (previous.fingerprint !== fingerprint) fail(409, 'request_reused')
          if (previous.result) { json(res, JSON.parse(previous.result)); return }
          fail(409, 'post_uncertain')
        }
        if (locks.has(key)) fail(409, 'thread_busy')
        limit(`post:${auth.user.id}`, 6, 60000)
        locks.set(key, true)
        try {
          const issue = await findThread(key, await publicReadToken())
          if (issue?.locked) fail(423, 'thread_locked')
          const marker = `\n<!-- bunko-post:${id} -->`
          db.prepare('INSERT INTO posts VALUES (?,?,NULL,?)').run(id, fingerprint, now() + 7 * 86400000)
          let result
          try {
            if (issue) {
              const comment = await github(`/repos/${REPO}/issues/${issue.number}/comments`, auth.token, { body: input.body.trim() + marker })
              result = { issue: safeIssue(issue), comment: safeComment(comment) }
            } else {
              const created = await github(`/repos/${REPO}/issues`, auth.token, { title: title(key), body: `> ${input.excerpt.replace(/\n/g, '\n> ')}\n\nPassage: ${key}\n\n${input.body.trim()}${marker}`, labels: ['passage'] })
              db.prepare('INSERT OR REPLACE INTO threads VALUES (?,?)').run(key, created.number)
              result = { issue: safeIssue(created), comment: null }
            }
          } catch (error) {
            // A transport timeout may follow a successful write. Never silently send that post twice.
            if ([401, 422, 429].includes(error.status)) db.prepare('DELETE FROM posts WHERE id=?').run(id)
            else fail(409, 'post_uncertain')
            throw error
          }
          db.prepare('UPDATE posts SET result=? WHERE id=?').run(JSON.stringify(result), id)
          for (const k of cache.keys()) if (k.startsWith(`${key}:`)) cache.delete(k)
          json(res, result); return
        } finally { locks.delete(key) }
      }
      fail(404, 'not_found')
    } catch (error) {
      // Only fixed route names and controlled error codes; never queries, bodies or tokens.
      if (process.env.BUNKO_LOG_ERRORS === '1' && (error.status ?? 503) >= 400) {
        const route = (req.url ?? '').split('?')[0]
        console.warn(JSON.stringify({ event: 'request_failed', route: postPaths.includes(route) ? route : 'other', status: error.status ?? 503, error: error.status ? error.code : 'temporarily_unavailable' }))
      }
      if (!res.headersSent) json(res, { error: error.status ? error.code : 'temporarily_unavailable' }, error.status ?? 503)
      else res.end()
    } finally { if (counted) active-- }
  })
  server.requestTimeout = 15000
  server.headersTimeout = 10000
  server.maxHeadersCount = 40
  server.keepAliveTimeout = 5000
  const timer = setInterval(cleanup, 60000); timer.unref()
  server.on('close', () => { clearInterval(timer); db.close() })
  return server
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  process.umask(0o077)
  const path = process.env.BUNKO_CONFIG
  if (!path) throw new Error('BUNKO_CONFIG is required')
  const stat = lstatSync(path)
  // systemd exposes LoadCredential files through a private mount with a read ACL (0440).
  const systemdCredential = path === '/run/credentials/bunko-discussions.service/config.json' && process.env.CREDENTIALS_DIRECTORY === '/run/credentials/bunko-discussions.service' && stat.uid === 0 && (stat.mode & 0o777) === 0o440
  if (!stat.isFile() || stat.isSymbolicLink() || ((stat.mode & 0o077) && !systemdCredential)) throw new Error('Config must be a protected regular file')
  const config = JSON.parse(readFileSync(path, 'utf8'))
  const server = createService(config, { database: process.env.BUNKO_DATABASE ?? '/var/lib/bunko-discussions/state.sqlite' })
  server.listen(Number(process.env.BUNKO_PORT ?? 18624), '127.0.0.1', () => console.log('Bunko discussions listening on loopback'))
  for (const event of ['SIGTERM', 'SIGINT']) process.on(event, () => { server.close(); setTimeout(() => process.exit(0), 15000).unref() })
}
