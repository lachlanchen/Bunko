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
