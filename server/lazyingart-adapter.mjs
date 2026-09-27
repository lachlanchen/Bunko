/**
 * Server-only preparation for bunko-v1. Not imported by service.mjs.
 * The caller must supply a durable, encrypted, atomic attempt store; see
 * docs/lazyingart-adapter.md before integrating any of these methods.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export const ACCOUNT_REGISTRATION = Object.freeze({
  contract: 'bunko-v1',
  clientId: 'bunko-server',
  audience: 'bunko-service',
  redirectUri: 'https://llm.lazying.art/bunko/oauth/lazyingart/callback',
})
const SIGN_IN = 'profile'
const LINK = 'profile legacy_identity:github'
const LINK_PURPOSE = 'link_existing_bunko_identity'
const paths = {
  authorization_endpoint: '/account/authorize', token_endpoint: '/account/token',
  profile_endpoint: '/account/profile', introspection_endpoint: '/account/introspect',
  revocation_endpoint: '/account/revoke',
}
const hash = value => createHash('sha256').update(value).digest('base64url')
const opaque = () => randomBytes(32).toString('base64url')
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const text = (value, max = 4096) => typeof value === 'string' && value.length > 0 && value.length <= max
const scopes = value => typeof value === 'string' ? [...new Set(value.split(' ').filter(Boolean))].sort().join(' ') : ''
const same = (left, right) => typeof left === 'string' && typeof right === 'string' && timingSafeEqual(Buffer.from(hash(left)), Buffer.from(hash(right)))
const unix = value => Number.isSafeInteger(value) && value >= 0
const fail = (code, options) => { throw new AccountAdapterError(code, options) }
const check = condition => { if (!condition) fail('contract_mismatch') }

export class AccountAdapterError extends Error {
  constructor(code, { retryable = false, reauthorize = false } = {}) {
    super(code)
    this.name = 'AccountAdapterError'
    this.code = code
    this.retryable = retryable
    this.reauthorize = reauthorize
  }
}

function expectedScope(value) {
  const normalized = scopes(value)
  check(normalized === scopes(SIGN_IN) || normalized === scopes(LINK))
  return normalized
}

async function readJson(response) {
  if (response.headers.get('content-type')?.split(';')[0].trim() !== 'application/json'
    || !response.body || Number(response.headers.get('content-length') || 0) > 65536) {
    await response.body?.cancel()
    fail('contract_mismatch')
  }
  const reader = response.body.getReader(), chunks = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 65536) { await reader.cancel(); fail('contract_mismatch') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  try {
    const result = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    check(object(result))
    return result
  } catch { fail('contract_mismatch') }
}

/** A missing/false enabled flag performs no config reads or network requests. */
export function createLazyingArtAdapter(config = {}, { fetchImpl = fetch, now = Date.now, attempts } = {}) {
  if (config.enabled !== true) return Object.freeze({ enabled: false })
  const { issuer, clientSecret } = config
  let parsed
  try { parsed = new URL(issuer) } catch { fail('not_configured') }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash
    || parsed.href.replace(/\/$/, '') !== issuer || issuer.endsWith('/')
    || !text(clientSecret) || Buffer.byteLength(clientSecret) < 32
    || typeof attempts?.create !== 'function' || typeof attempts?.consume !== 'function') fail('not_configured')
  for (const name of ['clientId', 'audience', 'redirectUri']) {
    if (config[name] !== undefined && config[name] !== ACCOUNT_REGISTRATION[name]) fail('not_configured')
  }
  const { clientId, audience, redirectUri } = ACCOUNT_REGISTRATION
  let readiness = null
  const seconds = () => Math.floor(now() / 1000)
  const requireReady = () => { if (!readiness) fail('not_ready') }

  async function request(path, fields) {
    try {
      const response = await fetchImpl(issuer + path, {
        method: fields ? 'POST' : 'GET', redirect: 'error', credentials: 'omit', cache: 'no-store',
        signal: AbortSignal.timeout(8000),
        headers: { Accept: 'application/json', ...(fields ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
        ...(fields ? { body: new URLSearchParams({ ...fields, client_id: clientId, audience, client_secret: clientSecret }).toString() } : {}),
      })
      // Gate by status before reading error bodies: HTML proxy failures are outages too.
      if (response.status === 429 || response.status >= 500) {
        await response.body?.cancel()
        fail('temporarily_unavailable', { retryable: true })
      }
      if (!fields && response.status === 404) { await response.body?.cancel(); fail('not_ready') }
      const data = await readJson(response)
      if (response.status === 401 && data.error === 'invalid_client') fail('client_configuration_error')
      if (response.status === 400 && data.error === 'invalid_grant') fail('reauthorization_required', { reauthorize: true })
      if ((response.status === 401 && data.error === 'invalid_token') || (response.status === 403 && data.error === 'account_unavailable')) {
        fail('account_inactive', { reauthorize: true })
      }
      check(response.status === 200)
      if (fields) check(response.headers.get('cache-control')?.split(',').some(value => value.trim().toLowerCase() === 'no-store'))
      return data
    } catch (error) {
      if (error instanceof AccountAdapterError) throw error
      // Never propagate upstream bodies, URLs, tokens or raw network errors.
      fail('temporarily_unavailable', { retryable: true })
    }
  }

  async function discover() {
    readiness = null
    const data = await request('/.well-known/lazyingart-account')
    check(data.issuer === issuer && data.contract_version === 1 && Array.isArray(data.adapter_contracts) && data.adapter_contracts.includes('bunko-v1'))
    for (const [key, path] of Object.entries(paths)) check(data[key] === issuer + path)
    for (const [key, values] of Object.entries({
      response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['client_secret_post'],
      scopes_supported: ['profile', 'legacy_identity:github'],
    })) check(Array.isArray(data[key]) && values.every(value => data[key].includes(value)))
    check(data.registration_requires_invitation === false && object(data.providers))
    check(['password', 'google', 'apple', 'github'].some(provider => data.providers[provider] === true))
    readiness = Object.freeze({ contract: 'bunko-v1', githubLinking: data.providers.github === true })
    return readiness
  }

  async function begin({ attemptId, binding, purpose = 'sign_in' }) {
    requireReady()
    check(text(attemptId, 256) && text(binding, 256) && binding.length >= 32)
    check(purpose === 'sign_in' || purpose === LINK_PURPOSE)
    if (purpose === LINK_PURPOSE && !readiness.githubLinking) fail('github_link_unavailable')
    const scope = purpose === 'sign_in' ? SIGN_IN : LINK
    const verifier = opaque(), state = opaque(), createdAt = seconds()
    // Only this server record contains the central verifier. The initiating
    // frontend attempt retains its separate PKCE challenge and completion rules.
    try {
      await attempts.create({
        attemptId, bindingHash: hash(binding), stateHash: hash(state), verifier,
        issuer, redirectUri, scope, purpose, createdAt, expiresAt: createdAt + 600,
      })
    } catch { fail('temporarily_unavailable', { retryable: true }) }
    const url = new URL(issuer + paths.authorization_endpoint)
    url.search = new URLSearchParams({
      response_type: 'code', client_id: clientId, audience, redirect_uri: redirectUri,
      scope, state, code_challenge: hash(verifier), code_challenge_method: 'S256',
    }).toString()
    return { authorizationUrl: url.href }
  }

  function credentials(data, scope) {
    check(text(data.access_token) && text(data.refresh_token) && data.token_type === 'Bearer')
    check(Number.isInteger(data.expires_in) && data.expires_in > 0 && data.expires_in <= 600)
    check(scopes(data.scope) === expectedScope(scope))
    return { accessToken: data.access_token, refreshToken: data.refresh_token, scope: scopes(data.scope), expiresAt: seconds() + data.expires_in }
  }

  async function introspect(accessToken, scope = SIGN_IN) {
    requireReady()
    check(text(accessToken))
    const normalized = expectedScope(scope)
    const data = await request(paths.introspection_endpoint, { token: accessToken, token_type_hint: 'access_token' })
    if (data.active === false) { check(Object.keys(data).length === 1); return { active: false } }
    const time = seconds(), account = data.account
    check(data.active === true && data.iss === issuer && data.client_id === clientId && data.aud === audience && data.token_type === 'Bearer')
    check(scopes(data.scope) === normalized && object(account))
    check(text(data.sub, 256) && data.sub.startsWith('la_') && account.subject === data.sub && account.account_status === 'active')
    check(typeof account.display_name === 'string' && account.display_name.length <= 1024 && typeof account.email_verified === 'boolean')
    check(unix(data.iat) && unix(data.exp) && unix(data.auth_time) && data.auth_time > 0 && data.iat <= time + 30
      && data.auth_time <= data.iat && data.exp > time && data.exp > data.iat && data.exp - data.iat <= 600)
    check(Array.isArray(data.verified_legacy_identities))
    const proofs = data.verified_legacy_identities
    check(normalized === scopes(LINK) ? proofs.length <= 1 : proofs.length === 0)
    const proof = proofs[0]
    if (proof) {
      check(object(proof) && proof.provider === 'github' && proof.issuer === 'https://github.com'
        && typeof proof.provider_subject === 'string' && /^[1-9][0-9]{0,19}$/.test(proof.provider_subject)
        && proof.proof_method === 'github_oauth_user_api' && proof.purpose === LINK_PURPOSE
        && unix(proof.verified_at) && unix(proof.proof_expires_at) && proof.verified_at <= time
        && proof.proof_expires_at === proof.verified_at + 300 && proof.proof_expires_at > time)
    }
    // Construct only allowed fields; never relay raw upstream responses.
    return {
      active: true, subject: data.sub, displayName: account.display_name, emailVerified: account.email_verified,
      authTime: data.auth_time, expiresAt: data.exp, scope: normalized,
      githubProof: proof ? { subject: proof.provider_subject, verifiedAt: proof.verified_at, expiresAt: proof.proof_expires_at } : null,
    }
  }

  async function complete({ callbackUrl, binding }) {
    requireReady()
    let callback
    try { callback = new URL(callbackUrl) } catch { fail('invalid_callback') }
    if (callback.origin + callback.pathname !== redirectUri || callback.username || callback.password || callback.hash
      || !text(binding, 256) || binding.length < 32) fail('invalid_callback')
    const query = callback.searchParams
    for (const key of ['state', 'iss', 'code', 'error']) if (query.getAll(key).length > 1) fail('invalid_callback')
    if (query.get('iss') !== issuer || !/^[A-Za-z0-9_-]{32,256}$/.test(query.get('state') || '')
      || (query.has('code') === query.has('error'))) fail('invalid_callback')
    const stateHash = hash(query.get('state')), bindingHash = hash(binding), time = seconds()
    // Store MUST consume atomically across workers and only on a matching
    // binding. Consume before contacting the token endpoint, including errors.
    let attempt
    try { attempt = await attempts.consume({ stateHash, bindingHash, now: time }) }
    catch { fail('reauthorization_required', { reauthorize: true }) }
    if (!attempt || !same(attempt.stateHash, stateHash) || !same(attempt.bindingHash, bindingHash)
      || attempt.issuer !== issuer || attempt.redirectUri !== redirectUri
      || !unix(attempt.expiresAt) || attempt.expiresAt <= time) fail('invalid_callback')
    check(attempt.purpose === 'sign_in' ? attempt.scope === SIGN_IN : attempt.purpose === LINK_PURPOSE && attempt.scope === LINK)
    check(/^[A-Za-z0-9_-]{43,128}$/.test(attempt.verifier || ''))
    if (query.has('error')) {
      if (query.get('error') === 'access_denied') fail('authorization_cancelled')
      fail('authorization_failed')
    }
    if (!text(query.get('code'))) fail('invalid_callback')
    // An ambiguous exchange cannot be replayed: the attempt is already consumed.
    let token
    try {
      token = credentials(await request(paths.token_endpoint, {
        grant_type: 'authorization_code', code: query.get('code'), redirect_uri: redirectUri, code_verifier: attempt.verifier,
      }), attempt.scope)
    } catch (error) {
      if (error instanceof AccountAdapterError && error.code === 'client_configuration_error') throw error
      fail('reauthorization_required', { reauthorize: true })
    }
    let account
    try {
      account = await introspect(token.accessToken, token.scope)
      if (!account.active) fail('account_inactive', { reauthorize: true })
    } catch (error) {
      if (error instanceof AccountAdapterError && ['client_configuration_error', 'account_inactive'].includes(error.code)) throw error
      // No Bunko session was created. This consumed login cannot be retried,
      // even when ordinary introspection would classify an outage as retryable.
      fail('reauthorization_required', { reauthorize: true })
    }
    return { attemptId: attempt.attemptId, purpose: attempt.purpose, account, credentials: token }
  }

  /** Low-level single request ONLY. Caller must durably claim rotation first. */
  async function refreshOnce({ refreshToken, scope }) {
    requireReady()
    check(text(refreshToken))
    expectedScope(scope)
    try {
      return credentials(await request(paths.token_endpoint, { grant_type: 'refresh_token', refresh_token: refreshToken }), scope)
    } catch (error) {
      if (error instanceof AccountAdapterError && error.code === 'client_configuration_error') throw error
      fail('reauthorization_required', { reauthorize: true })
    }
  }

  async function revoke(token) {
    requireReady()
    check(text(token))
    const result = await request(paths.revocation_endpoint, { token })
    check(result.success === true)
  }

  async function verifyGithubLink({ accessToken, legacyGithubId, explicitConsent }) {
    // Always fetch a fresh authoritative verdict; never accept a frontend
    // account/proof object, a stored provider row, or a cached login response.
    if (explicitConsent !== true) fail('fresh_link_required', { reauthorize: true })
    const account = await introspect(accessToken, LINK)
    return verifiedGithubLink(account, { legacyGithubId, explicitConsent, now: now() })
  }

  return Object.freeze({ enabled: true, discover, begin, complete, introspect, refreshOnce, revoke, verifyGithubLink })
}

/** Use only fresh direct introspection plus Bunko's server-verified legacy ID.
 * This returns a candidate mapping, NOT posting permission or a persisted merge.
 */
function verifiedGithubLink(account, { legacyGithubId, explicitConsent, now }) {
  const time = Math.floor(now / 1000), proof = account.githubProof
  if (explicitConsent !== true || !account.active || account.scope !== scopes(LINK)
    || !unix(account.authTime) || account.authTime > time || account.authTime + 300 <= time
    || !unix(account.expiresAt) || account.expiresAt <= time || !proof
    || !unix(proof.verifiedAt) || !unix(proof.expiresAt) || proof.verifiedAt > time
    || proof.expiresAt !== proof.verifiedAt + 300 || proof.expiresAt <= time
    || typeof legacyGithubId !== 'string' || !/^[1-9][0-9]{0,19}$/.test(legacyGithubId)
    || proof.subject !== legacyGithubId) fail('fresh_link_required', { reauthorize: true })
  return { subject: account.subject, provider: 'github', providerSubject: proof.subject }
}
