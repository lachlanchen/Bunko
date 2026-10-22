import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runStructuredReading } from './agent/structured-task.mjs'
const answer = { answer: 'Ada arrives.', citations: [{ passage: 'P1', quote: 'Ada arrives.' }] }
test('Lite preserves a large multilingual transcript and returns only a bounded proposal', async () => {
  const text = '本文。'.repeat(15000)
  const result = await runStructuredReading({ kind: 'answer', messages: [{ role: 'user', content: text }], maxTokens: 1000, timeoutMs: 500,
    complete: async (_url, options) => {
      assert.equal(JSON.parse(options.body).messages.at(-1).content, text)
      assert.ok(options.signal instanceof AbortSignal)
      return { choices: [{ message: { content: JSON.stringify(answer) } }] }
    } })
  assert.deepEqual(JSON.parse(JSON.stringify(result)), answer)
  assert.equal(Object.getPrototypeOf(result), null)
  assert.equal(Object.isFrozen(result), true)
})
test('malformed output is repairable, while secrets are rejected before provider invocation', async () => {
  let calls = 0
  const options = { kind: 'answer', messages: [{ role: 'user', content: 'Read P1.' }], maxTokens: 1000, timeoutMs: 500, complete: async () => { calls++; return { choices: [{ message: { content: 'not JSON' } }] } } }
  await assert.rejects(runStructuredReading(options), error => error.repairable === true)
  await assert.rejects(runStructuredReading({ ...options, messages: [{ role: 'user', content: 'OPENAI_API_KEY=sk-proj-1234567890abcdefghijklmnopqrstuvwxyzABCDEF' }] }), /secret keys/)
  assert.equal(calls, 1)
})
test('a timed-out provider cannot deliver late success or start a replacement call', async () => {
  let calls = 0, aborted = false
  await assert.rejects(runStructuredReading({ kind: 'answer', messages: [{ role: 'user', content: 'Read P1.' }], maxTokens: 1000, timeoutMs: 20,
    complete: async (_url, options) => {
      calls++; options.signal.addEventListener('abort', () => { aborted = true })
      await new Promise(resolve => setTimeout(resolve, 40))
      return { choices: [{ message: { content: JSON.stringify(answer) } }] }
    } }), /could not finish/)
  await new Promise(resolve => setTimeout(resolve, 45))
  assert.equal(calls, 1); assert.equal(aborted, true)
})

test('literal Markdown line breaks in JSON strings are recovered without altering the answer or evidence', async () => {
  const value = { answer: '人物关系\n\n- Ada → Ben\r\n\tHe said "hello". A literal \\n stays literal. 😀', knowledge: 'background', citations: [] }
  const raw = JSON.stringify(value).replaceAll('\\n', '\n').replaceAll('\\r', '\r').replaceAll('\\t', '\t')
  // Keep the intentionally escaped backslash in this valid part of the answer.
  const content = raw.replace('\\\n stays literal', '\\\\n stays literal')
  let calls = 0
  const result = await runStructuredReading({ kind: 'answer', messages: [{ role: 'user', content: 'Relationships' }], maxTokens: 1000, timeoutMs: 500,
    complete: async () => { calls++; return { choices: [{ finish_reason: 'stop', message: { content } }] } } })
  assert.deepEqual(JSON.parse(JSON.stringify(result)), value)
  assert.equal(calls, 1)
})

test('format recovery does not accept truncation, extra JSON, bad escapes, or wrong field types', async () => {
  const valid = JSON.stringify(answer)
  for (const content of [valid.slice(0, -1), valid + '{}', '{"answer":"bad\\q","citations":[]}', '{"answer":[],"citations":[]}']) {
    await assert.rejects(runStructuredReading({ kind: 'answer', messages: [{ role: 'user', content: 'Read P1' }], maxTokens: 1000, timeoutMs: 500,
      complete: async () => ({ choices: [{ message: { content } }] }) }), e => e.repairable === true && /reading answer/.test(e.message) && !!e.repairDetails)
  }
  await assert.rejects(runStructuredReading({ kind: 'answer', messages: [{ role: 'user', content: 'Read P1' }], maxTokens: 1000, timeoutMs: 500,
    complete: async () => ({ choices: [{ finish_reason: 'length', message: { content: valid } }] }) }), e => e.repairable === true && /truncated/.test(e.repairDetails))
})

test('nested schema faults give bounded field-specific repair hints without model text', async () => {
  const value = { ...answer, people: [{ id: 'a', name: 'Ada', detail: 'PRIVATE MODEL TEXT', aliases: [], citations: [], certainty: 'certain' }], relationships: [], places: [], routes: [], events: [] }
  await assert.rejects(runStructuredReading({ kind: 'guide', messages: [{ role: 'user', content: 'Build guide' }], maxTokens: 1000, timeoutMs: 500,
    complete: async () => ({ choices: [{ message: { content: JSON.stringify(value) } }] }) }), e => e.repairable === true && e.repairDetails.includes('$.people[0].certainty') && !e.repairDetails.includes('PRIVATE MODEL TEXT'))
})
