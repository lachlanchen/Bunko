import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { createModelRouter } from './agent/models.mjs'

function setup(provider) {
  const db = new DatabaseSync(':memory:')
  const router = createModelRouter({ db, provider, config: {
    model: { url: 'https://api.deepseek.com/chat/completions', name: 'deepseek-flash', token: 'private-deepseek' },
    models: { adminUserIds: [7], providers: { openai: { token: 'private-openai', qualifiedModels: ['gpt-6.1-sol'] } } },
  } })
  return { db, router }
}
test('admin catalog never exposes credentials; access and revision conflicts fail closed', () => {
  const { db, router } = setup()
  assert.throws(() => router.admin({ id: 8 }), /Administrator/)
  assert.throws(() => router.admin({ id: 7, kind: 'demo' }), /Administrator/)
  assert.throws(() => router.admin({ id: 7 }, { save: true, revision: 0, primary: 'gpt-6-astra' }), /Qualify/)
  const value = router.admin({ id: 7 }, { save: true, revision: 0, primary: 'deepseek-flash', fallback: 'gpt-6.1-sol' })
  assert.equal(value.revision, 1)
  assert.equal(JSON.stringify(value).includes('private-'), false)
  assert.throws(() => router.admin({ id: 7 }, { save: true, revision: 0, primary: 'gpt-6.1-sol' }), /Refresh/)
  assert.deepEqual(router.policy().providers, ['DeepSeek', 'OpenAI'])
  db.close()
})
test('qualified fallback uses provider-specific fields and explicit consent under one deadline', async () => {
  const calls = []
  const { db, router } = setup(async (url, options) => {
    calls.push({ url, ...options, body: JSON.parse(options.body) })
    if (calls.length === 1) throw Object.assign(new Error('busy'), { retryable: true })
    return { choices: [{ message: { content: '{}' } }] }
  })
  router.admin({ id: 7 }, { save: true, revision: 0, primary: 'deepseek-flash', fallback: 'gpt-6.1-sol' })
  await router.forRequest(['DeepSeek', 'OpenAI'])('https://attacker.invalid', { timeout: 1000, body: JSON.stringify({ model: 'untrusted', messages: [], max_tokens: 3000, temperature: .2 }) })
  assert.equal(calls[0].body.model, 'deepseek-flash')
  assert.equal(calls[1].url, 'https://api.openai.com/v1/chat/completions')
  assert.equal(calls[1].body.reasoning_effort, 'low')
  assert.equal(calls[1].body.max_completion_tokens, 4096)
  assert.equal('temperature' in calls[1].body, false)
  assert.ok(calls[1].timeout <= calls[0].timeout)
  assert.equal(calls[1].headers.Authorization, 'Bearer private-openai')
  db.close()
})
test('no silent cross-provider disclosure, no fallback after invalid output or cancellation', async () => {
  let calls = 0
  const { db, router } = setup(async () => { calls++; throw Object.assign(new Error('busy'), { retryable: true }) })
  router.admin({ id: 7 }, { save: true, revision: 0, primary: 'deepseek-flash', fallback: 'gpt-6.1-sol' })
  await assert.rejects(router.forRequest(['DeepSeek'])('', { body: '{}' }), /provider notice/)
  assert.equal(calls, 1)
  const controller = new AbortController(); controller.abort()
  await assert.rejects(router.forRequest(['DeepSeek', 'OpenAI'])('', { body: '{}', signal: controller.signal }), /interrupted/)
  assert.equal(calls, 1)
  db.close()
  const next = setup(async () => { throw new Error('invalid structured output') })
  next.router.admin({ id: 7 }, { save: true, revision: 0, primary: 'deepseek-flash', fallback: 'gpt-6.1-sol' })
  await assert.rejects(next.router.forRequest(['DeepSeek', 'OpenAI'])('', { body: '{}' }), /invalid structured output/)
  next.db.close()
})

test('host validation escalates one repair while ordinary questions remain on Flash', async () => {
  const calls = [], db = new DatabaseSync(':memory:')
  const router = createModelRouter({ db, config: { models: { adminUserIds: [7], capable: 'deepseek-v4-pro', providers: { deepseek: { token: 'private', qualifiedModels: ['deepseek-flash', 'deepseek-v4-pro'] } } } }, provider: async (url, options) => { calls.push({ url, ...options, body: JSON.parse(options.body) }); return {} } })
  const request = router.forRequest(['DeepSeek'])
  await request('', { body: JSON.stringify({ quality: 'repair', model: 'gpt-6-astra', messages: [] }) })
  await request('', { quality: 'repair', body: JSON.stringify({ messages: [] }) })
  assert.deepEqual(calls.map(c => c.body.model), ['deepseek-flash', 'deepseek-v4-pro'])
  assert.equal('quality' in calls[1], false)
  const settings = router.admin({ id: 7 })
  assert.equal(settings.capable, 'deepseek-v4-pro')
  assert.equal(router.admin({ id: 7 }, { save: true, revision: 0, primary: 'deepseek-flash', fallback: '' }).capable, 'deepseek-v4-pro')
  assert.throws(() => router.admin({ id: 7 }, { save: true, revision: 1, primary: 'deepseek-flash', capable: 'unconfigured' }), /Qualify/)
  db.close()
})

test('repair escalation requires consent and freezes configuration for the existing request', async () => {
  const { db, router } = setup(async () => ({}))
  router.admin({ id: 7 }, { save: true, revision: 0, primary: 'deepseek-flash', capable: 'gpt-6.1-sol' })
  const pending = router.forRequest(['DeepSeek'])
  assert.deepEqual(router.policy().providers, ['DeepSeek', 'OpenAI'])
  router.admin({ id: 7 }, { save: true, revision: 1, primary: 'deepseek-flash', capable: '' })
  await assert.rejects(pending('', { quality: 'repair', body: '{}' }), /provider notice/)
  db.close()
})

test('DeepSeek scope pins initial, transient fallback and repair even with an OpenAI admin default', async () => {
  const db = new DatabaseSync(':memory:'), calls = []
  const router = createModelRouter({ db, config: { models: { adminUserIds: [7], providers: {
    deepseek: { token: 'fixture-ds', qualifiedModels: ['deepseek-flash', 'deepseek-v4-pro'] },
    openai: { token: 'fixture-oa', qualifiedModels: ['gpt-6.1-sol'] },
  } } }, provider: async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) })
    if (calls.length === 1) throw Object.assign(new Error('busy'), { retryable: true })
    return {}
  } })
  router.admin({ id: 7 }, { save: true, revision: 0, primary: 'gpt-6.1-sol', fallback: '', capable: 'gpt-6.1-sol' })
  const scope = { deepseekOnly: true }
  assert.deepEqual(router.policy(scope), { providers: ['DeepSeek'], consentKey: 'DeepSeek' })
  const request = router.forRequest(['DeepSeek'], scope)
  await request('', { body: '{}' })
  await request('', { quality: 'repair', body: '{}' })
  assert.deepEqual(calls.map(c => c.body.model), ['deepseek-flash', 'deepseek-v4-pro', 'deepseek-v4-pro'])
  assert.ok(calls.every(c => c.url === 'https://api.deepseek.com/chat/completions'))
  db.close()
})

test('a DeepSeek label cannot route regional requests through an unqualified gateway', async () => {
  const db = new DatabaseSync(':memory:'); let calls = 0
  const router = createModelRouter({ db, config: { model: { name: 'deepseek-flash', url: 'https://other.invalid/chat/completions' } }, provider: async () => { calls++; return {} } })
  await assert.rejects(router.forRequest(['DeepSeek'], { deepseekOnly: true })('', { body: '{}' }), /not connected/)
  assert.equal(calls, 0); db.close()
})
