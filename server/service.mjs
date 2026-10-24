import { companionAvailability, companionClientAddress, generatesContent } from './companion-region.mjs'
import {linkFailures,linkFailure} from './account-link-errors.mjs'
import {sharePage} from './share-page.mjs'
import {createRewardSourceRoutes} from './reward-source-routes.mjs'
import {createProfileStore} from './shared-link-store.mjs'
import {createGitHubConnections} from './github-connection.mjs'
import {PROFILE_BINDING,ProfileLinkError} from './lazyingart-profile.mjs'
import {createLacBalance,LacReadError} from './lac-balance.mjs'
import { createDocumentAgent, agentPaths } from './agent/service.mjs'
import { AppError } from './agent/common.mjs'
import { createDemoAuth } from './demo-auth.mjs'
import { createBookMirror } from './book-mirror.mjs'
import { createCloudLedger, cloudOwner } from './cloud-ledger.mjs'
import { createCloudBilling } from './cloud-billing.mjs'
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

export function createService(config, { fetchImpl = fetch, now = Date.now, database = ':memory:', profileOptions = {}, pointsProvider, rewardOptions = {} } = {}) {
  const base = new URL(config.publicUrl)
  if (base.protocol !== 'https:' || base.pathname !== PREFIX || base.search || base.hash) throw new Error('Invalid publicUrl')
  const origins = new Set(config.origins ?? ['https://lachlan.lazying.art', 'https://lachlanchen.github.io', 'capacitor://localhost', 'https://localhost', 'bunko://localhost', 'null'])
  const key = Buffer.from(config.encryptionKey, 'base64')
  if (key.length !== 32) throw new Error('Expected 32-byte encryption key')
  const demo = createDemoAuth(config.demoAccount)
  if (demo.enabled && (!config.appId || !config.appPrivateKey)) throw new Error('Demo discussions require the repository GitHub App')
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
  db.exec('CREATE TABLE IF NOT EXISTS discussion_authors(kind TEXT NOT NULL,id INTEGER NOT NULL,owner TEXT NOT NULL,user TEXT NOT NULL,PRIMARY KEY(kind,id))')
  const displayComment = (comment, kind = 'comment') => {
    if (!comment) return null
    const result = kind === 'issue' ? safeIssue(comment) : safeComment(comment)
    const author = db.prepare('SELECT user FROM discussion_authors WHERE kind=? AND id=?').get(kind, comment.id)
    return author ? {...result,user:JSON.parse(author.user)} : result
  }
  // Revocation is durable even if a disabled account is later re-enabled with
  // the same password. Do not wait for each old device to make a request.
  db.exec('BEGIN IMMEDIATE')
  try {
    for (const table of ['sessions', 'flows']) {
      for (const row of db.prepare(`SELECT id,data FROM ${table}`).all()) {
        let value
        try { value = unseal(row.data) } catch { continue }
        if ((value.provider === 'demo' || value.demoVersion) && !demo.current(value.demoVersion)) db.prepare(`DELETE FROM ${table} WHERE id=?`).run(row.id)
      }
    }
    db.exec('COMMIT')
  } catch (error) { db.exec('ROLLBACK'); db.close(); throw error }
  const localSession = id => {
    const row=db.prepare('SELECT data FROM sessions WHERE id=? AND expires>?').get(id,now())
    if(!row)return null
    const auth=unseal(row.data)
    if(auth.provider==='demo')return null
    return {owner:cloudOwner(auth.user),user:auth.user,authenticatedAt:auth.authenticatedAt}
  }
  const activeOwner=owner=>db.prepare('SELECT id FROM sessions WHERE expires>?').all(now()).some(row=>localSession(row.id)?.owner===owner)
  db.exec('CREATE TABLE IF NOT EXISTS bunko_local_accounts(owner TEXT PRIMARY KEY,user TEXT NOT NULL)')
  for(const row of db.prepare('SELECT data FROM sessions').all()){
    try{const auth=unseal(row.data);if(auth.provider!=='demo'&&auth.user)db.prepare('INSERT OR IGNORE INTO bunko_local_accounts VALUES(?,?)').run(cloudOwner(auth.user),seal(auth.user))}catch{/* Preserve unreadable historical rows. */}
  }
  const legacyOwnerExists=owner=>{
    for(const {name} of db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()){
      if(!/^(?:agent_|cloud_|profile_|lac_|discussion_|github_|bunko_)[a-z_]+$/.test(name))continue
      if(db.prepare('PRAGMA table_info('+name+')').all().some(c=>c.name==='owner')&&db.prepare('SELECT 1 FROM '+name+' WHERE owner=? LIMIT 1').get(owner))return true
    }
    return false
  }
  const githubConnections=createGitHubConnections({db,seal,unseal,now,legacyOwnerExists,active:activeOwner,refresh:async(data,expected)=>{
    const response=await fetchImpl('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:config.clientId,client_secret:config.clientSecret,grant_type:'refresh_token',refresh_token:data.refreshToken}),signal:AbortSignal.timeout(12000),redirect:'error'})
    const value=await response.json()
    if(!response.ok||!value.access_token||!value.refresh_token||!Number.isFinite(value.expires_in)||!Number.isFinite(value.refresh_token_expires_in))throw new ProfileLinkError('github_reconnect_required')
    const user=safeUser(await github('/user',value.access_token));if(user.id!==expected.id)throw new ProfileLinkError('identity_invalid')
    return{token:value.access_token,refreshToken:value.refresh_token,accessExpires:now()+Math.min(SESSION_MS,value.expires_in*1000),refreshExpires:now()+value.refresh_token_expires_in*1000}
  }})
  const profileStore={db,localSession,active:activeOwner,requireActive:owner=>{if(!activeOwner(owner))throw new ProfileLinkError('local_session_changed')},flowActive:id=>!!db.prepare('SELECT 1 FROM flows WHERE id=? AND expires>?').get(id,now())}
  const sharedProfile=createProfileStore(profileStore,config.lazyingart,{...profileOptions,now})
  if(sharedProfile.enabled&&config.publicUrl+'/oauth/lazyingart/callback'!==PROFILE_BINDING.redirectUri)throw new Error('Shared callback binding mismatch')
  const lacBalance=createLacBalance(db,config.lacPoints,{binding:PROFILE_BINDING,profile:sharedProfile,provider:pointsProvider,now})
  const rewards=createRewardSourceRoutes(profileStore,{origin:base.origin,rewardSource:config.rewardSource},{...rewardOptions,now})
  const revokeTimer=sharedProfile.flushRevocations?setInterval(()=>void sharedProfile.flushRevocations(),30000):null;revokeTimer?.unref()
  const cloudLedger = createCloudLedger(db, config.billing || {}, now)
  const cloudBilling = createCloudBilling(cloudLedger, config.billing || {}, { seal, unseal })
  const bookMirror = config.bookMirror?.enabled === true ? createBookMirror({ database: config.bookMirror.database, maxBytes: config.bookMirror.maxBytes, fetchImpl, now }) : null
  const agent = createDocumentAgent({ db, seal, unseal, config: config.agent || {}, cloud: cloudLedger, readBook: bookMirror?.get, now })
  const cleanup = () => {
    for (const table of ['flows', 'sessions', 'posts']) db.prepare(`DELETE FROM ${table} WHERE expires < ?`).run(now())
  }
  const limits = new Map(), cache = new Map(), locks = new Map()
  let active = 0, uploading = 0, verifying = 0
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
  const installationAccess = new Map(), installationPending = new Map()
  async function installationToken(permission = 'read') {
    if (!config.appId || !config.appPrivateKey) return undefined
    const cached = installationAccess.get(permission)
    if (cached?.expires > now()) return cached.token
    if (installationPending.has(permission)) return installationPending.get(permission)
    const pending = (async () => {
      const encoded = value => Buffer.from(JSON.stringify(value)).toString('base64url')
      const seconds = Math.floor(now() / 1000)
      const payload = `${encoded({ alg: 'RS256', typ: 'JWT' })}.${encoded({ iat: seconds - 60, exp: seconds + 540, iss: String(config.appId) })}`
      const signer = createSign('RSA-SHA256'); signer.update(payload)
      const jwt = `${payload}.${signer.sign(config.appPrivateKey, 'base64url')}`
      const installation = await github(`/repos/${REPO}/installation`, jwt)
      if (!Number.isSafeInteger(installation.id)) fail(502, 'github_unavailable')
      const result = await github(`/app/installations/${installation.id}/access_tokens`, jwt, { repository_ids: [REPO_ID], permissions: { issues: permission } })
      const expires = Date.parse(result.expires_at) - 60000
      if (typeof result.token !== 'string' || !Number.isFinite(expires) || expires <= now()) fail(502, 'github_unavailable')
      installationAccess.set(permission, { token: result.token, expires })
      return result.token
    })().finally(() => { installationPending.delete(permission) })
    installationPending.set(permission, pending)
    return pending
  }
  const publicReadToken = () => installationToken('read')
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
    if(auth.provider==='github-linked'){
      const connection=await githubConnections.credential(cloudOwner(auth.user))
      if(!connection||connection.epoch!==auth.githubEpoch||!db.prepare('SELECT id FROM sessions WHERE id=?').get(row.id))fail(401,'sign_in_again')
      const expires=now()+PERSISTENT_MS;db.prepare('UPDATE sessions SET expires=? WHERE id=?').run(expires,row.id)
      if(auth.storage==='cookie'&&res)cookie(res,value,expires)
      return{...auth,token:connection.token,githubUser:connection.github,expires,sessionId:row.id}
    }
    if (auth.provider === 'lazyingart') {
      try { await sharedProfile.authorizeSession(cloudOwner(auth.user), {fresh:refresh,epoch:auth.profileEpoch}) }
      catch(error) { if(['reconnect_required','authorization_rejected'].includes(error.code)){db.prepare('DELETE FROM sessions WHERE id=?').run(row.id);fail(401,'sign_in_again')} throw error }
      if(!db.prepare('SELECT id FROM sessions WHERE id=?').get(row.id))fail(401,'sign_in_again')
      const expires=now()+PERSISTENT_MS
      db.prepare('UPDATE sessions SET expires=? WHERE id=?').run(expires,row.id)
      if(auth.storage==='cookie'&&res)cookie(res,value,expires)
      return {...auth,expires,sessionId:row.id}
    }
    if (auth.provider === 'demo') {
      if (!demo.current(auth.demoVersion)) { db.prepare('DELETE FROM sessions WHERE id=?').run(row.id); fail(401, 'sign_in_again') }
      const expires = now() + PERSISTENT_MS
      db.prepare('UPDATE sessions SET expires=? WHERE id=?').run(expires, row.id)
      if (auth.storage === 'cookie' && res) cookie(res, value, expires)
      return { ...auth, expires, sessionId: row.id }
    }
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
  async function body(req, maxBytes = 18000, retainRaw = false) {
    if (req.headers['content-type'] !== 'application/json') fail(415, 'json_required')
    const chunks = []; let length = 0
    for await (const chunk of req) {
      length += chunk.length
      if (length > maxBytes) fail(413, 'too_large')
      chunks.push(chunk)
    }
    try { const raw = Buffer.concat(chunks), value = JSON.parse(raw.toString('utf8')); if (!value || Array.isArray(value) || typeof value !== 'object') fail(400, 'invalid_json'); return retainRaw ? { value, raw } : value } catch { fail(400, 'invalid_json') }
  }
  function json(res, value, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)) }
  function callbackPage(res, platform, id, error = false) {
    // The flow ID is not a credential: completing it requires the app's original verifier.
    const target = platform === 'native' ? `art.lazying.bunko://oauth/complete?flow=${id}` : null
    const nonce = opaque()
    res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Sign in · Bunko</title><style nonce="${nonce}">body{font:18px system-ui;background:#faf7f0;color:#272942;max-width:32rem;margin:15vh auto;padding:2rem;line-height:1.7}a{color:#403d78}</style><h1>Bunko · 文庫</h1><p>${error ? 'Sign-in was not completed. Return to Bunko and try again.' : 'Signed in. Return to Bunko to continue your conversation.'}</p>${target ? `<a href="${target}">Return to Bunko</a><script nonce="${nonce}">location.replace(${JSON.stringify(target)})</script>` : `<script nonce="${nonce}">window.close()</script>`}</html>`)
  }
  const cloudPaths = ['catalog', 'purchase', 'checkout', 'portal', 'restore'].map(p => `${PREFIX}/v1/cloud/${p}`)
  const notificationPaths = ['apple', 'google', 'stripe'].map(p => `${PREFIX}/v1/cloud/notifications/${p}`)
  const postPaths = ['/v1/auth/methods', '/v1/auth/start', '/v1/auth/cancel', '/v1/auth/demo', '/v1/auth/complete', '/v1/session', '/v1/logout', '/v1/discussions/read', '/v1/discussions/post', ...['status','start','complete','cancel','disconnect','balance','activity'].map(p=>'/v1/lazyingart/'+p), ...agentPaths].map(p => PREFIX + p).concat(cloudPaths)
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Vary', 'Origin')
    let counted = false, countedUpload = false
    try {
      if (req.headers.host !== base.host) fail(404, 'not_found')
      if (active >= 40) fail(503, 'busy')
      active++; counted = true
      const raw = req.url ?? '', path = raw.split('?')[0]
      if(await rewards.route(req,res))return
      if (![`${PREFIX}/oauth/callback`,`${PREFIX}/oauth/lazyingart`,`${PREFIX}/oauth/lazyingart/callback`].includes(path) && raw !== path) fail(404, 'not_found')
      const sharedBook = path.match(new RegExp('^' + PREFIX + '/share/book/([a-z0-9-]{1,120})$'))
      if (sharedBook && ['GET','HEAD'].includes(req.method)) {
        if (!bookMirror) fail(503, 'book_mirror_unavailable')
        limit(`share:${req.socket.remoteAddress}`, 90, 60000)
        const index = JSON.parse(Buffer.from((await bookMirror.get('reader-index.json')).body).toString('utf8'))
        const book = index.books.find(row => row.id === sharedBook[1])
        if (!book) fail(404, 'book_not_found')
        const id = book.id, title = book.title?.en || Object.values(book.title || {})[0] || id
        const card = {app:'Bunko',title,description:book.author || 'Read with interlaced languages and ruby readings.',url:'https://bunko.lazying.art/bunko/share/book/'+id,web:'https://lachlan.lazying.art/Bunko/?book='+id,native:'art.lazying.bunko://book/'+id,image:'https://lachlan.lazying.art/Bunko/icon-512.png',appleID:'6815137919',androidID:'art.lazying.bunko'}
        res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src https://lachlan.lazying.art; base-uri 'none'; frame-ancestors 'none'")
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'})
        res.end(req.method === 'HEAD' ? undefined : sharePage(card)); return
      }
      if (bookMirror && path.startsWith(`${PREFIX}/books-cache/`)) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        if (!['GET', 'HEAD'].includes(req.method)) fail(405, 'method_denied')
        const ip = req.headers['x-bunko-client-address'] ?? req.socket.remoteAddress
        limit(`books:${ip}`, 600, 60000)
        await bookMirror.respond(req, res, path.slice(`${PREFIX}/books-cache/`.length)); return
      }
      if (notificationPaths.includes(path)) {
        if (req.method !== 'POST') fail(405, 'method_denied')
        limit(`billing-hook:${req.headers['x-bunko-client-address'] ?? req.socket.remoteAddress}`, 120, 60000)
        const input = await body(req, 200000, true)
        json(res, await cloudBilling.notification(path.split('/').pop(), req, input.value, input.raw)); return
      }
      if (!postPaths.includes(path) && ![`${PREFIX}/healthz`, `${PREFIX}/oauth/callback`,`${PREFIX}/oauth/lazyingart`,`${PREFIX}/oauth/lazyingart/callback`].includes(path)) fail(404, 'not_found')
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
      if(req.method==='GET'&&path===`${PREFIX}/oauth/lazyingart`){
        if(!sharedProfile.enabled)fail(503,'shared_login_unavailable')
        const ticket=new URL(raw,base).searchParams.get('ticket'),row=db.prepare('SELECT data FROM flows WHERE id=? AND expires>?').get(ticket,now())
        if(!row)fail(400,'flow_expired')
        const flow=unseal(row.data);if(!['shared-link','shared-login'].includes(flow.kind)||flow.started)fail(400,'invalid_flow')
        db.prepare('UPDATE flows SET data=? WHERE id=?').run(seal({...flow,started:true}),ticket)
        const binder=opaque(),result=await sharedProfile.begin({binding:binder,...flow.context,flow:ticket,intent:flow.kind==='shared-login'?'login':'link',provider:flow.provider})
        res.setHeader('Set-Cookie',`__Host-bunko-link=${binder}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600`)
        res.writeHead(303,{Location:result.authorizationUrl});res.end();return
      }
      if(req.method==='GET'&&path===`${PREFIX}/oauth/lazyingart/callback`){
        if(!sharedProfile.enabled)fail(503,'shared_login_unavailable')
        const binder=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('__Host-bunko-link='))?.slice('__Host-bunko-link='.length)
        let result
        try {result=await sharedProfile.complete({callbackUrl:new URL(raw,base).href,binding:binder})}
        catch(error){
          // The store attaches this flow only after verifying/consuming callback proof.
          if(error instanceof ProfileLinkError&&error.linkFlow&&linkFailures[error.code]){
            const row=db.prepare('SELECT data FROM flows WHERE id=? AND expires>?').get(error.linkFlow,now())
            const flow=row&&unseal(row.data)
            if(['shared-link','shared-login'].includes(flow?.kind)){
              db.prepare('UPDATE flows SET data=? WHERE id=?').run(seal({...flow,linkError:error.code,error:true,reauthError:error.code}),error.linkFlow)
              res.setHeader('Set-Cookie','__Host-bunko-link=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0')
              if(flow.platform==='native'){callbackPage(res,flow.platform,error.linkFlow,true);return}
              res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"})
              res.end('<!doctype html><meta name="viewport" content="width=device-width"><title>Bunko account connection</title><h1>Account not connected</h1><p>'+linkFailure(error.code).message+'</p><p>Return to Bunko to continue.</p>');return
            }
          }
          throw error
        }
        const row=db.prepare('SELECT data FROM flows WHERE id=? AND expires>?').get(result.flow,now())
        if(!row)fail(400,'flow_expired')
        const flow=unseal(row.data)
        if(flow.kind==='shared-login') {
          db.prepare('UPDATE flows SET data=? WHERE id=?').run(seal({...flow,auth:{provider:'lazyingart',user:result.user,profileEpoch:result.epoch,storage:flow.storage,authenticatedAt:now(),expires:now()+PERSISTENT_MS}}),result.flow)
          res.setHeader('Set-Cookie','__Host-bunko-link=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0')
          callbackPage(res,flow.platform,result.flow);return
        }
        db.prepare('UPDATE flows SET data=? WHERE id=?').run(seal({...flow,completed:true}),result.flow)
        // GitHub-first readers already granted the repository-scoped connection.
        // Keep that identity available when they later sign in through a central provider.
        const original=db.prepare('SELECT data FROM sessions WHERE id=?').get(flow.context.sessionHash)
        const local=original&&unseal(original.data)
        if(local&&local.provider!=='lazyingart'&&local.provider!=='demo'&&local.provider!=='github-linked'&&Number.isSafeInteger(local.user.id)){
          const connected=githubConnections.connect(local.user,local.user,local)
          db.prepare('UPDATE sessions SET data=? WHERE id=?').run(seal({provider:'github-linked',user:local.user,githubEpoch:connected.epoch,storage:local.storage,authenticatedAt:local.authenticatedAt}),flow.context.sessionHash)
        }
        res.setHeader('Set-Cookie','__Host-bunko-link=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0')
        if(flow.platform==='native'){callbackPage(res,flow.platform,result.flow);return}
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"})
        res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Bunko account connected</title><h1>Account connected</h1><p>Return to Bunko to continue reading.</p></html>');return
      }
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
          const linked=githubConnections.lookup(user.id),canonical=linked?.user||user
          if(flow.reauth&&(cloudOwner(canonical)!==flow.reauth.owner||localSession(flow.reauth.sessionHash)?.owner!==flow.reauth.owner))throw new ProfileLinkError('local_session_changed')
          if(flow.connectGithub&&localSession(flow.connectGithub.sessionHash)?.owner!==flow.connectGithub.owner)throw new ProfileLinkError('local_session_changed')
          const accessExpires = now() + Math.min(SESSION_MS, (token.expires_in ?? 28800) * 1000)
          const persistent = !!flow.storage && typeof token.refresh_token === 'string' && Number.isFinite(token.refresh_token_expires_in)
          flow.auth = { token: token.access_token, user, authenticatedAt:now(), accessExpires, expires: accessExpires, persistent, storage: flow.storage,
            ...(persistent ? { refreshToken: token.refresh_token, refreshExpires: now() + token.refresh_token_expires_in * 1000 } : {}) }
          // Refresh tokens stay encrypted on the cloud; only Bunko's opaque session reaches native storage.
          if(linked)flow.canonical=canonical
          delete flow.githubVerifier
          db.prepare('UPDATE flows SET data=? WHERE id=?').run(seal(flow), row.id)
          callbackPage(res, flow.platform, row.id)
        } catch(error) {
          db.prepare('UPDATE flows SET data=? WHERE id=?').run(seal({ ...flow, error: true, reauthError:(flow.reauth||flow.connectGithub)&&error instanceof ProfileLinkError?error.code:undefined, githubVerifier: undefined }), row.id)
          callbackPage(res, flow.platform, row.id, true)
        }
        return
      }
      if (req.method !== 'POST' || !postPaths.includes(path)) fail(405, 'method_denied')
      if (!origin || req.headers['x-bunko-client'] !== '1') fail(403, 'origin_required')
      if (cloudPaths.includes(path)) {
        const action = path.split('/').pop()
        let auth
        try { auth = await session(req, res) } catch (error) { if (action !== 'catalog' || error.status !== 401) throw error }
        const input = await body(req, action === 'purchase' ? 120000 : 18000)
        if (auth && !db.prepare('SELECT id FROM sessions WHERE id=?').get(auth.sessionId)) fail(401, 'sign_in_again')
        const owner = auth ? cloudOwner(auth.user) : null
        if (action === 'catalog') { json(res, cloudBilling.catalog(owner)); return }
        limit(`billing:${owner}`, 20, 60000)
        json(res, action === 'purchase' ? await cloudBilling.purchase(input.platform, input, owner) : await cloudBilling.web(action, input, owner)); return
      }
      if(path.startsWith(`${PREFIX}/v1/lazyingart/`)){
        const action=path.split('/').pop(),input=await body(req)
        let auth;try{auth=await session(req,res,false)}catch(e){if(action!=='status'||e.status!==401)throw e}
        if(action==='status'){const owner=auth&&cloudOwner(auth.user);json(res,{enabled:sharedProfile.linkEnabled??sharedProfile.enabled,points: lacBalance.enabled,signedIn:!!auth,eligible:!!auth&&auth.provider!=='demo',...(auth&&sharedProfile.status?sharedProfile.status(owner):{linked:false,state:'unlinked'}),github:auth&&auth.provider!=='demo'?{available:sharedProfile.canLink?.(owner)===true,...githubConnections.status(owner),...(!['lazyingart','github-linked'].includes(auth.provider)?{connected:true,state:'active',login:auth.user.login}:{})}:undefined});return}
        if(!auth||auth.provider==='demo')fail(403,'shared_account_requires_personal_login')
        if(action==='activity'){
          if(Object.keys(input).length!==1||input.kind!=='foreground')fail(400,'invalid_activity')
          limit(`lac-activity:${cloudOwner(auth.user)}`,12,60000)
          json(res,await rewards.foreground({id:cloudOwner(auth.user)}));return
        }
        if(!sharedProfile.enabled)fail(503,'shared_login_unavailable')
        const owner=cloudOwner(auth.user)
        if(action==='start'){
          if(!sharedProfile.canLink(owner))fail(503,'shared_login_unavailable')
          if(!validOpaque(input.challenge)||input.consent!==true)fail(400,'explicit_link_required')
          if(!Number.isSafeInteger(auth.authenticatedAt)||auth.authenticatedAt<now()-600000)fail(403,'local_reauthentication_required')
          const id=opaque(),context={owner,sessionHash:auth.sessionId,authenticatedAt:auth.authenticatedAt}
          db.prepare('INSERT INTO flows VALUES(?,NULL,?,?)').run(id,seal({kind:'shared-link',challenge:input.challenge,context,platform:input.platform==='native'?'native':'web'}),now()+FLOW_MS)
          json(res,{flow:id,url:config.publicUrl+'/oauth/lazyingart?ticket='+id});return
        }
        if(action==='complete'||action==='cancel'){
          const row=db.prepare('SELECT data FROM flows WHERE id=? AND expires>?').get(input.flow,now());if(!row)fail(410,'flow_expired')
          const flow=unseal(row.data)
          if(flow.kind!=='shared-link'||flow.context.sessionHash!==auth.sessionId||!validOpaque(input.verifier)||!same(hash(input.verifier),flow.challenge))fail(400,'invalid_verifier')
          if(action==='cancel'){db.prepare('DELETE FROM flows WHERE id=?').run(input.flow);json(res,{ok:true});return}
          if(flow.linkError)throw new ProfileLinkError(flow.linkError)
          json(res,flow.completed?{linked:true}:{pending:true});return
        }
        if(action==='disconnect'){if(auth.provider==='lazyingart')fail(409,'use_sign_out');rewards.hold(owner);sharedProfile.disconnect(owner);json(res,{ok:true});return}
        if(action==='balance'){
          if(!lacBalance.enabled)fail(503,'points_not_qualified')
          const value=await lacBalance.read(owner)
          if(!localSession(auth.sessionId))fail(401,'sign_in_again')
          json(res,value);return
        }
      }
      const isAgent = agentPaths.includes(path.slice(PREFIX.length))
      if (isAgent) {
        if (path.endsWith('/upload')) {
          if (uploading >= 1) fail(503, 'busy')
          uploading++; countedUpload = true
        }
        const auth = await session(req, res)
        limit(`agent:${auth.user.id}`, 100, 60000)
        const input = await body(req, path.endsWith('/upload') ? 27_000_000 : 18000)
        // Sign-out during a large upload invalidates this operation.
        if (!db.prepare('SELECT id FROM sessions WHERE id=?').get(auth.sessionId)) fail(401, 'sign_in_again')
        const action = path.split('/').pop()
        if (generatesContent(action) && !companionAvailability(input.clientRegion, companionClientAddress(req)).available) fail(403, 'companion_region_unavailable')
        json(res, await agent.handle(action, input, auth.user)); return
      }
      const input = await body(req)
      if(path===`${PREFIX}/v1/auth/methods`){
        let additional=[]
        try{additional=await sharedProfile.loginProviders?.({advertised:true})||[]}catch{ /* Existing GitHub remains available during an issuer outage. */ }
        json(res,{providers:[...(config.clientId&&config.clientSecret?['github']:[]),...additional],companion:companionAvailability(input.clientRegion,companionClientAddress(req))});return
      }
      if (path === `${PREFIX}/v1/auth/demo`) {
        if (!demo.enabled) fail(503, 'demo_unavailable')
        limit(`demo:${ip}`, 8, 900000)
        limit('demo:global', 100, 900000)
        if (!validOpaque(input.challenge) || !['web', 'native'].includes(input.platform)) fail(400, 'invalid_flow')
        if (!['cookie', 'secure'].includes(input.storage)) fail(400, 'invalid_flow')
        if (input.storage === 'cookie' && (origin !== 'https://lachlan.lazying.art' || input.platform !== 'web')) fail(400, 'invalid_flow')
        if (input.storage === 'secure' && input.platform !== 'native') fail(400, 'invalid_flow')
        if (verifying >= 2) fail(503, 'busy')
        let verified
        verifying++
        try { verified = await demo.verify(input.username, input.password) } finally { verifying-- }
        if (!verified) fail(401, 'invalid_demo_credentials')
        const id = opaque(), expires = now() + PERSISTENT_MS
        // Use the same bound completion and secure session storage as OAuth.
        // The password response alone never creates a cookie or app session.
        const auth = { provider: 'demo', demoVersion: demo.version, user: demo.user, storage: input.storage, expires }
        db.prepare('INSERT INTO flows VALUES (?,NULL,?,?)').run(id, seal({ challenge: input.challenge, storage: input.storage, demoVersion: demo.version, auth }), now() + FLOW_MS)
        json(res, { flow: id }); return
      }
      if (path === `${PREFIX}/v1/auth/start`) {
        const provider=input.provider??'github'
        if(!['github','google','apple','lazyingart'].includes(provider))fail(400,'invalid_flow')
        if (provider==='github'&&(!config.clientId || !config.clientSecret)) fail(503, 'not_configured')
        limit(`start:${ip}`, 10, 600000)
        if (!validOpaque(input.challenge) || !['web', 'native'].includes(input.platform)) fail(400, 'invalid_flow')
        const storage = input.storage
        if (storage !== undefined && !['cookie', 'secure'].includes(storage)) fail(400, 'invalid_flow')
        if (storage === 'cookie' && (origin !== 'https://lachlan.lazying.art' || input.platform !== 'web')) fail(400, 'invalid_flow')
        if (storage === 'secure' && input.platform !== 'native') fail(400, 'invalid_flow')
        const local=input.reauthenticate===true||input.connectGithub===true?await session(req,res,input.connectGithub===true):null
        if(local?.provider==='demo')fail(403,'shared_account_requires_personal_login')
        let connectGithub
        if(input.connectGithub===true){
          if(provider!=='github'||input.consent!==true||input.reauthenticate===true)fail(400,'explicit_link_required')
          if(!sharedProfile.canLink?.(cloudOwner(local.user)))fail(503,'shared_login_unavailable')
          if(!Number.isSafeInteger(local.authenticatedAt)||local.authenticatedAt<now()-600000)throw new ProfileLinkError('local_reauthentication_required')
          connectGithub={owner:cloudOwner(local.user),sessionHash:local.sessionId,user:local.user}
        }
        const reauth=local&&!connectGithub?{owner:cloudOwner(local.user),sessionHash:local.sessionId}:null
        if(provider!=='github'){
          if(!(await sharedProfile.loginProviders?.()||[]).includes(provider))fail(503,'provider_unavailable')
          if(!local&&credential(req))fail(409,'sign_out_before_login')
          const id=opaque(),context=local?{owner:cloudOwner(local.user),sessionHash:local.sessionId,authenticatedAt:local.authenticatedAt}:{}
          db.prepare('INSERT INTO flows VALUES(?,NULL,?,?)').run(id,seal({kind:'shared-login',provider,challenge:input.challenge,platform:input.platform,storage,context,...(reauth?{reauth}:{})}),now()+FLOW_MS)
          json(res,{flow:id,url:config.publicUrl+'/oauth/lazyingart?ticket='+id});return
        }
        const id = opaque(), state = opaque(), verifier = opaque()
        db.prepare('INSERT INTO flows VALUES (?,?,?,?)').run(id, hash(state), seal({ challenge: input.challenge, platform: input.platform, storage, githubVerifier: verifier,...(reauth?{reauth}:{}),...(connectGithub?{connectGithub}:{}) }), now() + FLOW_MS)
        json(res, { flow: id, url: `https://github.com/login/oauth/authorize?${new URLSearchParams({ client_id: config.clientId, redirect_uri: `${config.publicUrl}/oauth/callback`, state, code_challenge: hash(verifier), code_challenge_method: 'S256' })}` }); return
      }
      if (path === `${PREFIX}/v1/auth/complete` || path===`${PREFIX}/v1/auth/cancel`) {
        if (!validOpaque(input.flow) || !validOpaque(input.verifier)) fail(400, 'invalid_flow')
        const row = db.prepare('SELECT * FROM flows WHERE id=? AND expires>?').get(input.flow, now())
        if (!row) fail(410, 'flow_expired')
        const flow = unseal(row.data)
        if(flow.kind==='shared-link')fail(400,'invalid_flow')
        if (!same(flow.challenge, hash(input.verifier))) fail(403, 'invalid_verifier')
        if(path.endsWith('/cancel')){
          if(flow.completed?.token)db.prepare('DELETE FROM sessions WHERE id=?').run(hash(flow.completed.token))
          if(flow.completing)db.prepare('DELETE FROM sessions WHERE id=?').run(hash(flow.completing))
          db.prepare('DELETE FROM flows WHERE id=?').run(row.id);json(res,{ok:true});return
        }
        if (flow.demoVersion && !demo.current(flow.demoVersion)) fail(401, 'sign_in_again')
        if (flow.completed) {
          const completedSession=db.prepare('SELECT data FROM sessions WHERE id=? AND expires>?').get(hash(flow.completed.token), now())
          if (!completedSession) fail(410, 'flow_expired')
          const completedAuth=unseal(completedSession.data)
          if(completedAuth.provider==='lazyingart')await sharedProfile.authorizeSession(cloudOwner(completedAuth.user),{fresh:true,epoch:completedAuth.profileEpoch})
          if (flow.storage === 'cookie') cookie(res, flow.completed.token, flow.completed.expires)
          json(res, { ...flow.completed, ...(flow.storage === 'cookie' ? { token: undefined } : {}) }); return
        }
        if (flow.error) { db.prepare('DELETE FROM flows WHERE id=?').run(row.id); if(flow.reauthError)throw new ProfileLinkError(flow.reauthError);fail(400, 'authorization_cancelled') }
        if(flow.completing){json(res,{pending:true});return}
        if (!flow.auth) { json(res, { pending: true }); return }
        const token = opaque()
        db.prepare('UPDATE flows SET data=? WHERE id=?').run(seal({...flow,completing:token}),row.id)
        const requireFlow=()=>{const current=db.prepare('SELECT data FROM flows WHERE id=? AND expires>?').get(row.id,now());if(!current||unseal(current.data).completing!==token)fail(410,'flow_expired')}
        try {
        if(flow.reauth){const local=await session(req,res,false);if(local.sessionId!==flow.reauth.sessionHash||cloudOwner(local.user)!==flow.reauth.owner)throw new ProfileLinkError('local_session_changed')}
        if(flow.connectGithub||flow.canonical){
          if(flow.connectGithub){const local=await session(req,res,true);if(local.sessionId!==flow.connectGithub.sessionHash||cloudOwner(local.user)!==flow.connectGithub.owner)throw new ProfileLinkError('local_session_changed')}
          requireFlow()
          const linked=githubConnections.connect(flow.connectGithub?.user||flow.canonical,flow.auth.user,flow.auth)
          flow.auth={provider:'github-linked',user:linked.user,githubEpoch:linked.epoch,storage:flow.storage,authenticatedAt:now(),expires:now()+PERSISTENT_MS}
        }
        requireFlow()
        const expires = flow.auth.persistent ? Math.min(now() + PERSISTENT_MS, flow.auth.refreshExpires) : flow.auth.expires
        db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hash(token), seal(flow.auth), expires)
        if(flow.auth.provider!=='demo')db.prepare('INSERT OR IGNORE INTO bunko_local_accounts VALUES(?,?)').run(cloudOwner(flow.auth.user),seal(flow.auth.user))
        if(flow.auth.provider==='lazyingart')await sharedProfile.authorizeSession(cloudOwner(flow.auth.user),{fresh:true,epoch:flow.auth.profileEpoch})
        requireFlow()
        const completed = { token, user: flow.auth.user, expires, ...(flow.auth.provider==='lazyingart'?{method:'lazyingart'}:{}) }
        // A lost completion response can be recovered with the same bound verifier.
        db.prepare('UPDATE flows SET data=?, expires=? WHERE id=?').run(seal({ challenge: flow.challenge, storage: flow.storage, demoVersion: flow.demoVersion, completed }), now() + 60000, row.id)
        if (flow.storage === 'cookie') cookie(res, token, expires)
        json(res, { ...completed, ...(flow.storage === 'cookie' ? { token: undefined } : {}) }); return
        }catch(error){
          db.prepare('DELETE FROM sessions WHERE id=?').run(hash(token))
          const current=db.prepare('SELECT data FROM flows WHERE id=?').get(row.id)
          if(current&&unseal(current.data).completing===token)db.prepare('UPDATE flows SET data=? WHERE id=?').run(row.data,row.id)
          throw error
        }
      }
      if (path === `${PREFIX}/v1/discussions/read`) {
        const key = passage(input.passage), page = input.page ?? 1
        if (!Number.isSafeInteger(page) || page < 1 || page > 100) fail(400, 'invalid_page')
        const cacheKey = `${key}:${page}`, cached = cache.get(cacheKey)
        if (cached?.until > now()) { json(res, cached.value); return }
        const token = await publicReadToken()
        const issue = await findThread(key, token)
        const comments = issue ? await github(`/repos/${REPO}/issues/${issue.number}/comments?per_page=30&page=${page}`, token) : []
        const value = { issue: displayComment(issue,'issue'), comments: comments.map(c=>displayComment(c)), nextPage: comments.length === 30 ? page + 1 : null }
        if (cache.size >= 500) cache.delete(cache.keys().next().value)
        cache.set(cacheKey, { value, until: now() + 60000 }); json(res, value); return
      }
      if (path === `${PREFIX}/v1/logout`) {
        const value = credential(req)
        if (value) {
          const local=localSession(hash(value))
          db.prepare('DELETE FROM sessions WHERE id=?').run(hash(value))
          // Other devices keep their own valid session. Revoke the shared
          // credential when the last app session leaves, or on explicit unlink.
          if(local&&!activeOwner(local.owner))sharedProfile.disconnect?.(local.owner)
        }
        cookie(res, ''); json(res, { ok: true }); return
      }
      const auth = await session(req, res)
      if (path === `${PREFIX}/v1/session`) {
        try { if (!['demo','lazyingart'].includes(auth.provider)){const providerUser=await github('/user',auth.token);if(providerUser.id!==(auth.githubUser||auth.user).id)fail(401,'sign_in_again')} } catch (error) {
          if (error.status === 401) { db.prepare('DELETE FROM sessions WHERE id=?').run(auth.sessionId); cookie(res, '') }
          throw error
        }
        json(res, { user: auth.user, expires: auth.expires, ...(auth.provider==='lazyingart'?{method:'lazyingart'}:{}) }); return
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
          const personal=auth.provider==='lazyingart'?await githubConnections.credential(cloudOwner(auth.user)):null
          const serviceAuthor=auth.provider==='demo'||(auth.provider==='lazyingart'&&!personal)
          const token = personal?.token||(serviceAuthor ? await installationToken('write') : auth.token)
          if(serviceAuthor&&!token)fail(503,'discussion_posting_unavailable')
          // This remains a real public post, visibly attributed to the demo
          // account. Never impersonate the owner or a GitHub reviewer identity.
          const attribution=auth.provider==='lazyingart'&&serviceAuthor?`**${auth.user.login.replace(/[\r\n\\`*_\[\]<>#]/g,' ').slice(0,128)}** · Bunko reader · Posted through Bunko\n\n`:auth.provider==='demo'?'**Bunko demo account** · Posted through Bunko\n\n':''
          const commentBody = attribution + input.body.trim()
          const rememberAuthor=(kind,item)=>{if(auth.provider==='lazyingart'&&serviceAuthor)db.prepare('INSERT INTO discussion_authors VALUES(?,?,?,?)').run(kind,item.id,cloudOwner(auth.user),JSON.stringify({...auth.user,kind:'lazyingart'}))}
          const marker = `\n<!-- bunko-post:${id} -->`
          db.prepare('INSERT INTO posts VALUES (?,?,NULL,?)').run(id, fingerprint, now() + 7 * 86400000)
          let result
          try {
            if (issue) {
              const comment = await github(`/repos/${REPO}/issues/${issue.number}/comments`, token, { body: commentBody + marker })
              rememberAuthor('comment',comment)
              result = { issue: displayComment(issue,'issue'), comment: displayComment(comment) }
            } else {
              const created = await github(`/repos/${REPO}/issues`, token, { title: title(key), body: `> ${input.excerpt.replace(/\n/g, '\n> ')}\n\nPassage: ${key}\n\n${commentBody}${marker}`, labels: ['passage'] })
              db.prepare('INSERT OR REPLACE INTO threads VALUES (?,?)').run(key, created.number)
              rememberAuthor('issue',created)
              result = { issue: displayComment(created,'issue'), comment: null }
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
      if(error instanceof ProfileLinkError)error.status=linkFailure(error.code).status
      if(error instanceof LacReadError)error.status=['points_link_required','points_consent_required'].includes(error.code)?403:503
      // Only fixed route names and controlled error codes; never queries, bodies or tokens.
      if (process.env.BUNKO_LOG_ERRORS === '1' && (error.status ?? 503) >= 400) {
        const route = (req.url ?? '').split('?')[0]
        console.warn(JSON.stringify({ event: 'request_failed', route: postPaths.includes(route) ? route : 'other', status: error.status ?? 503, error: error.status ? error.code : 'temporarily_unavailable' }))
      }
      if (!res.headersSent) json(res, { error: error.status ? error.code : 'temporarily_unavailable', ...(error instanceof AppError ? { detail: error.message.slice(0, 300) } : {}) }, error.status ?? 503)
      else res.end()
    } finally { if (counted) active--; if (countedUpload) uploading-- }
  })
  server.requestTimeout = 120000
  server.headersTimeout = 10000
  server.maxHeadersCount = 40
  server.keepAliveTimeout = 5000
  const timer = setInterval(cleanup, 60000); timer.unref()
  server.on('close', () => { clearInterval(timer); clearInterval(revokeTimer); agent.close(); cloudBilling.stop(); db.close(); void bookMirror?.close() })
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
