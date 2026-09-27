import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { ACCOUNT_REGISTRATION, AccountAdapterError, createLazyingArtAdapter } from './lazyingart-adapter.mjs'

const issuer = 'https://accounts.example.test'
const secret = 'synthetic-fixture-secret-not-a-real-credential'
const binding = 'synthetic-server-held-frontend-attempt-binding'
const sha = value => createHash('sha256').update(value).digest('base64url')
const config = { enabled: true, issuer, clientSecret: secret }
const linkScope = 'profile legacy_identity:github'
const linkPurpose = 'link_existing_bunko_identity'
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
const rejects = (promise, code, flags = {}) => assert.rejects(promise, error => {
  assert.ok(error instanceof AccountAdapterError)
  assert.equal(error.code, code)
  for (const [name, value] of Object.entries(flags)) assert.equal(error[name], value)
  assert.ok(!error.message.includes(secret))
  return true
})

function discovery() {
  return {
    issuer, contract_version: 1, adapter_contracts: ['bunko-v1'],
    authorization_endpoint: issuer + '/account/authorize', token_endpoint: issuer + '/account/token',
    profile_endpoint: issuer + '/account/profile', introspection_endpoint: issuer + '/account/introspect',
    revocation_endpoint: issuer + '/account/revoke', response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'], code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_post'], scopes_supported: ['profile', 'legacy_identity:github'],
    registration_requires_invitation: false, providers: { password: true, google: false, apple: false, github: true },
  }
}

function setup() {
  let time = 1800000000000, discoveryBody = discovery(), tokenScope = 'profile', active = true, hook
  const records = new Map(), requests = []
  // Deliberately a fixture, NOT a production or multi-worker storage adapter.
  const attempts = {
    async create(record) { assert.ok(!records.has(record.stateHash)); records.set(record.stateHash, record) },
    async consume({ stateHash, bindingHash, now }) {
      const record = records.get(stateHash)
      if (!record || record.bindingHash !== bindingHash || record.expiresAt <= now) return null
      records.delete(stateHash)
      return record
    },
  }
  const activeResponse = () => ({
    active: true, iss: issuer, sub: 'la_fixture_subject', client_id: 'bunko-server', aud: 'bunko-service',
    scope: tokenScope, token_type: 'Bearer', iat: Math.floor(time / 1000), exp: Math.floor(time / 1000) + 600,
    auth_time: Math.floor(time / 1000) - 20,
    account: { subject: 'la_fixture_subject', display_name: '<b>Reader</b>', account_status: 'active', email_verified: false },
    verified_legacy_identities: tokenScope.includes('legacy_identity:github') ? [{
      provider: 'github', issuer: 'https://github.com', provider_subject: '12345678',
      verified_at: Math.floor(time / 1000) - 10, proof_expires_at: Math.floor(time / 1000) + 290,
      proof_method: 'github_oauth_user_api', purpose: linkPurpose,
    }] : [],
  })
  const fetchImpl = async (url, options) => {
    requests.push({ url, options })
    assert.equal(new URL(url).origin, issuer)
    assert.equal(options.redirect, 'error')
    assert.equal(options.credentials, 'omit')
    assert.equal(options.cache, 'no-store')
    assert.ok(options.signal instanceof AbortSignal)
    if (options.method === 'POST') {
      const input = new URLSearchParams(options.body)
      assert.equal(options.headers['Content-Type'], 'application/x-www-form-urlencoded')
      assert.equal(input.get('client_id'), 'bunko-server')
      assert.equal(input.get('audience'), 'bunko-service')
      assert.equal(input.get('client_secret'), secret)
      assert.ok(!url.includes(secret))
    }
    const custom = await hook?.(url, options)
    if (custom) return custom
    if (url.endsWith('/.well-known/lazyingart-account')) return json(discoveryBody)
    if (url.endsWith('/account/token')) return json({ access_token: 'fixture-access', refresh_token: 'fixture-refresh', token_type: 'Bearer', expires_in: 600, scope: tokenScope })
    if (url.endsWith('/account/introspect')) return json(active ? activeResponse() : { active: false })
    if (url.endsWith('/account/revoke')) return json({ success: true })
    assert.fail('Unexpected endpoint')
  }
  const adapter = createLazyingArtAdapter(config, { fetchImpl, now: () => time, attempts })
  const begin = async (purpose = 'sign_in') => {
    const result = await adapter.begin({ attemptId: 'server-verified-frontend-flow', binding, purpose })
    const url = new URL(result.authorizationUrl)
    const callback = new URL(ACCOUNT_REGISTRATION.redirectUri)
    callback.search = new URLSearchParams({ iss: issuer, state: url.searchParams.get('state'), code: 'fixture-code' }).toString()
    return { result, url, callback, record: records.get(sha(url.searchParams.get('state'))) }
  }
  return {
    adapter, attempts, records, requests, begin, activeResponse,
    now: () => time, advance: ms => { time += ms }, discovery: value => { discoveryBody = value },
    scope: value => { tokenScope = value }, active: value => { active = value }, hook: value => { hook = value },
  }
}

test('disabled adapter has no network surface; enabled adapter requires private config and a store', () => {
  assert.deepEqual(createLazyingArtAdapter(), { enabled: false })
  assert.deepEqual(createLazyingArtAdapter({ enabled: false, issuer: 'not-a-url' }, { fetchImpl: () => assert.fail() }), { enabled: false })
  for (const overrides of [{ issuer: 'http://accounts.example.test' }, { issuer: issuer + '/' }, { issuer: issuer + '/?x=1' },
    { issuer: 'https://user:pass@accounts.example.test' }, { clientSecret: 'short' }, { clientId: 'other-app' },
    { audience: 'echomind' }, { redirectUri: 'https://evil.example/callback' }]) {
    assert.throws(() => createLazyingArtAdapter({ ...config, ...overrides }, { attempts: setup().attempts }), { code: 'not_configured' })
  }
  assert.throws(() => createLazyingArtAdapter(config), { code: 'not_configured' })
})

test('discovery rejects baseline-only contracts, altered endpoints, and invitation-gated registration', async () => {
  const s = setup()
  await rejects(s.begin(), 'not_ready')
  for (const patch of [{ adapter_contracts: [] }, { adapter_contracts: 'bunko-v1' }, { contract_version: 2 }, { issuer: 'https://other.example' },
    { token_endpoint: 'https://evil.example/token' }, { introspection_endpoint: issuer + '/other' },
    { code_challenge_methods_supported: ['plain'] }, { token_endpoint_auth_methods_supported: ['none'] },
    { scopes_supported: ['profile'] }, { registration_requires_invitation: true }]) {
    s.discovery({ ...discovery(), ...patch })
    await rejects(s.adapter.discover(), 'contract_mismatch')
    await rejects(s.begin(), 'not_ready')
  }
  s.discovery(discovery())
  assert.deepEqual(await s.adapter.discover(), { contract: 'bunko-v1', githubLinking: true })
  s.discovery({ ...discovery(), providers: { password: true, github: false } })
  await s.adapter.discover()
  await s.begin()
  await rejects(s.begin(linkPurpose), 'github_link_unavailable')
})

test('central PKCE is independent, callback is bound and single-use, output is allowlisted', async () => {
  const s = setup()
  await s.adapter.discover()
  const frontendVerifier = randomBytes(32).toString('base64url')
  const flow = await s.begin()
  assert.equal(flow.url.searchParams.get('code_challenge'), sha(flow.record.verifier))
  assert.notEqual(flow.record.verifier, frontendVerifier)
  assert.notEqual(flow.url.searchParams.get('code_challenge'), sha(frontendVerifier))
  assert.equal(flow.url.searchParams.get('code_challenge_method'), 'S256')
  assert.equal(flow.url.searchParams.get('scope'), 'profile')
  assert.equal(flow.url.searchParams.get('redirect_uri'), ACCOUNT_REGISTRATION.redirectUri)
  assert.deepEqual(Object.keys(flow.result), ['authorizationUrl'])
  assert.ok(!JSON.stringify(flow.result).includes(flow.record.verifier))
  await rejects(s.adapter.complete({ callbackUrl: flow.callback, binding: binding + '-wrong' }), 'invalid_callback')
  const outcomes = await Promise.allSettled([1, 2].map(() => s.adapter.complete({ callbackUrl: flow.callback, binding })))
  assert.equal(outcomes.filter(value => value.status === 'fulfilled').length, 1)
  assert.equal(outcomes.find(value => value.status === 'rejected').reason.code, 'invalid_callback')
  const completed = outcomes.find(value => value.status === 'fulfilled').value
  assert.equal(completed.attemptId, 'server-verified-frontend-flow')
  assert.equal(completed.account.subject, 'la_fixture_subject')
  assert.equal(completed.account.displayName, '<b>Reader</b>') // Untrusted text; never HTML.
  assert.equal(completed.account.githubProof, null)
  assert.equal(completed.credentials.accessToken, 'fixture-access') // Server-only envelope.
  const tokenCalls = s.requests.filter(value => value.url.endsWith('/account/token'))
  assert.equal(tokenCalls.length, 1)
  assert.equal(new URLSearchParams(tokenCalls[0].options.body).get('code_verifier'), flow.record.verifier)
})

test('issuer, duplicate query, callback, expiry and cancellation checks precede exchange', async () => {
  const s = setup()
  await s.adapter.discover()
  const flow = await s.begin()
  for (const mutate of [url => url.searchParams.set('iss', 'https://evil.example'), url => url.searchParams.delete('iss'),
    url => url.searchParams.append('state', 'duplicate'), url => url.searchParams.append('iss', issuer),
    url => url.searchParams.append('code', 'duplicate'), url => { url.pathname += '/'; },
    url => { url.hash = 'fragment'; }, url => url.searchParams.set('error', 'access_denied')]) {
    const callback = new URL(flow.callback)
    mutate(callback)
    await rejects(s.adapter.complete({ callbackUrl: callback, binding }), 'invalid_callback')
  }
  flow.callback.searchParams.delete('code')
  flow.callback.searchParams.set('error', 'access_denied')
  await rejects(s.adapter.complete({ callbackUrl: flow.callback, binding }), 'authorization_cancelled')
  await rejects(s.adapter.complete({ callbackUrl: flow.callback, binding }), 'invalid_callback')
  const expired = await s.begin()
  s.advance(600000)
  await rejects(s.adapter.complete({ callbackUrl: expired.callback, binding }), 'invalid_callback')
  assert.equal(s.requests.filter(value => value.url.endsWith('/account/token')).length, 0)
})

test('introspection rejects identity, audience, scope, expiry and unsolicited proof mismatches', async () => {
  const s = setup()
  await s.adapter.discover()
  const good = s.activeResponse()
  for (const patch of [{ iss: 'https://other.example' }, { client_id: 'other-client' }, { aud: 'other-service' },
    { sub: 'la_other_subject' }, { scope: linkScope }, { exp: good.iat }, { exp: good.iat + 601 },
    { iat: good.iat + 40 }, { auth_time: good.iat + 40 }, { token_type: 'ID' },
    { account: { ...good.account, account_status: 'suspended' } }, { account: { ...good.account, email_verified: 'true' } },
    { verified_legacy_identities: [{ provider: 'github' }] }, { active: false, sub: 'la_disclosed' }]) {
    s.hook(url => url.endsWith('/introspect') ? json({ ...good, ...patch }) : null)
    await rejects(s.adapter.introspect('fixture-access'), 'contract_mismatch')
  }
  s.hook(url => url.endsWith('/introspect') ? json({ ...good, provider_token: 'must-not-be-forwarded', email: 'private@example.test' }) : null)
  const result = await s.adapter.introspect('fixture-access')
  assert.ok(!JSON.stringify(result).includes('must-not-be-forwarded'))
  assert.equal(result.email, undefined)
})

test('fresh direct numeric GitHub proof requires explicit consent and matching server-held identity', async () => {
  const s = setup()
  s.scope(linkScope)
  await s.adapter.discover()
  const flow = await s.begin(linkPurpose)
  assert.equal(flow.url.searchParams.get('scope'), linkScope)
  const completed = await s.adapter.complete({ callbackUrl: flow.callback, binding })
  const options = { accessToken: completed.credentials.accessToken, legacyGithubId: '12345678', explicitConsent: true }
  assert.deepEqual(await s.adapter.verifyGithubLink(options), { subject: 'la_fixture_subject', provider: 'github', providerSubject: '12345678' })
  for (const patch of [{ legacyGithubId: '87654321' }, { legacyGithubId: 'github-login' }, { legacyGithubId: 12345678 },
    { explicitConsent: false }]) {
    await rejects(s.adapter.verifyGithubLink({ ...options, ...patch }), 'fresh_link_required')
  }
  const good = s.activeResponse(), proof = good.verified_legacy_identities[0]
  for (const patch of [{ verified_legacy_identities: [] }, { auth_time: s.now() / 1000 - 301 }]) {
    s.hook(url => url.endsWith('/introspect') ? json({ ...good, ...patch }) : null)
    await rejects(s.adapter.verifyGithubLink(options), 'fresh_link_required')
  }
  s.hook(url => url.endsWith('/introspect') ? json({ active: false }) : null)
  await rejects(s.adapter.verifyGithubLink(options), 'fresh_link_required')
  for (const patch of [{ provider_subject: 'github-login' }, { provider_subject: '012345' }, { provider_subject: 12345678 },
    { issuer: 'https://other.example' }, { purpose: 'login' }, { proof_method: 'stored_provider_row' },
    { proof_expires_at: proof.proof_expires_at + 1 }, { verified_at: s.now() / 1000 - 301, proof_expires_at: s.now() / 1000 - 1 }]) {
    s.hook(url => url.endsWith('/introspect') ? json({ ...good, verified_legacy_identities: [{ ...proof, ...patch }] }) : null)
    await rejects(s.adapter.introspect('fixture-access', linkScope), 'contract_mismatch')
  }
  s.hook(url => url.endsWith('/introspect') ? json(good) : null)
  s.advance(300000)
  await rejects(s.adapter.verifyGithubLink(options), 'contract_mismatch')
})

test('no positive introspection cache; outage is distinct from an inactive account or bad client', async () => {
  const s = setup()
  await s.adapter.discover()
  assert.equal((await s.adapter.introspect('fixture-access')).active, true)
  s.active(false)
  assert.deepEqual(await s.adapter.introspect('fixture-access'), { active: false })
  for (const status of [429, 500, 503]) {
    s.hook(() => new Response('proxy error with no JSON', { status }))
    await rejects(s.adapter.introspect('fixture-access'), 'temporarily_unavailable', { retryable: true, reauthorize: false })
  }
  s.hook(() => { throw new Error(secret + ' raw upstream failure') })
  await rejects(s.adapter.introspect('fixture-access'), 'temporarily_unavailable', { retryable: true })
  s.hook(() => json({ error: 'invalid_client' }, 401))
  await rejects(s.adapter.introspect('fixture-access'), 'client_configuration_error', { reauthorize: false })
  assert.equal(s.requests.filter(value => value.url.endsWith('/account/introspect')).length, 7)
})

test('lost code and refresh responses are not retried; refresh scope cannot grow or drop', async () => {
  const s = setup()
  await s.adapter.discover()
  const flow = await s.begin()
  s.hook(url => { if (url.endsWith('/token')) throw new Error('lost after server rotated credentials') })
  await rejects(s.adapter.complete({ callbackUrl: flow.callback, binding }), 'reauthorization_required', { reauthorize: true, retryable: false })
  await rejects(s.adapter.complete({ callbackUrl: flow.callback, binding }), 'invalid_callback')
  const before = s.requests.length
  await rejects(s.adapter.refreshOnce({ refreshToken: 'claimed-once-fixture', scope: 'profile' }), 'reauthorization_required', { reauthorize: true, retryable: false })
  assert.equal(s.requests.length, before + 1)
  s.hook(null)
  s.scope(linkScope)
  await rejects(s.adapter.refreshOnce({ refreshToken: 'claimed-once-fixture-2', scope: 'profile' }), 'reauthorization_required')
  s.scope('profile')
  await rejects(s.adapter.refreshOnce({ refreshToken: 'claimed-once-fixture-3', scope: linkScope }), 'reauthorization_required')
  s.scope('legacy_identity:github profile')
  const tokens = await s.adapter.refreshOnce({ refreshToken: 'claimed-once-fixture-4', scope: linkScope })
  assert.equal(tokens.scope, 'legacy_identity:github profile')
})

test('bounded JSON, no-store credential responses and revocation acknowledgement are enforced', async () => {
  const s = setup()
  await s.adapter.discover()
  s.hook(() => json({ padding: 'x'.repeat(65536) }))
  await rejects(s.adapter.introspect('fixture-access'), 'contract_mismatch')
  s.hook(() => new Response('<html>unexpected</html>', { headers: { 'Content-Type': 'text/html' } }))
  await rejects(s.adapter.introspect('fixture-access'), 'contract_mismatch')
  s.hook(() => Response.json(s.activeResponse()))
  await rejects(s.adapter.introspect('fixture-access'), 'contract_mismatch')
  s.hook(null)
  await s.adapter.revoke('fixture-refresh')
  assert.equal(new URLSearchParams(s.requests.at(-1).options.body).get('token'), 'fixture-refresh')
  s.hook(() => new Response('offline', { status: 503 }))
  await rejects(s.adapter.revoke('fixture-refresh'), 'temporarily_unavailable', { retryable: true })
  s.hook(() => json({ success: false }))
  await rejects(s.adapter.revoke('fixture-refresh'), 'contract_mismatch')
})

test('storage failure is sanitized, and a failed post-exchange check requires a new login', async () => {
  const s = setup()
  await s.adapter.discover()
  const create = s.attempts.create
  s.attempts.create = () => { throw new Error(secret + ' sensitive storage detail') }
  await rejects(s.begin(), 'temporarily_unavailable')
  s.attempts.create = create
  const flow = await s.begin()
  s.hook(url => url.endsWith('/introspect') ? new Response('proxy unavailable', { status: 503 }) : null)
  await rejects(s.adapter.complete({ callbackUrl: flow.callback, binding }), 'reauthorization_required', { retryable: false, reauthorize: true })
  await rejects(s.adapter.complete({ callbackUrl: flow.callback, binding }), 'invalid_callback')
  const next = await s.begin()
  s.attempts.consume = () => { throw new Error(secret + ' sensitive storage detail') }
  await rejects(s.adapter.complete({ callbackUrl: next.callback, binding }), 'reauthorization_required')
})
