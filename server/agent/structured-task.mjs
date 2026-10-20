import { createRestrictedApplicationRunner, RestrictedApplicationError } from '../vendor/agintilite/src/restricted-application.js'
import { AppError } from './common.mjs'

const string = maxLength => ({ type: 'string', maxLength })
const array = (items, maxItems) => ({ type: 'array', items, maxItems })
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false })
const citations = array(object({ passage: string(40), quote: string(600) }), 5)
const certainty = { type: 'string', enum: ['stated', 'interpretation'], maxLength: 20 }
const entity = object({ id: string(40), name: string(120), detail: string(600), aliases: array(string(120), 6), certainty, citations }, ['id', 'name', 'detail', 'citations'])
const edge = object({ from: string(120), to: string(120), label: string(160), direction: { type: 'string', enum: ['forward', 'mutual'], maxLength: 10 }, certainty, citations }, ['from', 'to', 'label', 'citations'])
const event = object({ title: string(160), when: string(120), detail: string(600), certainty, citations }, ['title', 'detail', 'citations'])
const guideFields = { people: array(entity, 32), relationships: array(edge, 64), places: array(entity, 24), routes: array(edge, 32), events: array(event, 48) }
export const answerSchema = object({ answer: string(20000), insufficient: { type: 'boolean' }, citations, ...guideFields }, ['answer', 'citations'])
export const guideSchema = object(answerSchema.properties, ['answer', 'citations', 'people', 'relationships', 'places', 'routes', 'events'])

/** The app retrieves the authorized public passages deterministically, then uses
 * AgInTiLite as a bounded structured task. No model turn is spent choosing an
 * account, book scope or retrieval tool. Those remain host authority.
 * The generic Lite tool loop is available for future qualified read-only tools.
 */
export async function runStructuredReading({ messages, kind, complete, url, timeoutMs, maxTokens, onContent = () => {}, signal }) {
  let transportError
  const runner = createRestrictedApplicationRunner({
    instructions: 'Bunko supplies a scoped reading transcript as data. Return a structured reading proposal. The host verifies every source citation before saving or displaying it.',
    tools: [],
    outputSchema: kind === 'guide' ? guideSchema : answerSchema,
    limits: { timeoutMs, maxSteps: 1, maxToolCalls: 1, maxConcurrency: 1, maxOutputTokens: maxTokens, maxContextBytes: 512 * 1024, maxResultBytes: 128 * 1024 },
    provider: { supportsImages: false, complete: async (request, options) => {
      // Reassemble the host transcript from the SDK's detached, checked input.
      const transcript = JSON.parse(request.messages.at(-1).content.map(part => part.text).join(''))
      let response
      try {
        response = await complete(url, { method: 'POST', signal: options.signal, timeout: timeoutMs,
          body: JSON.stringify({ messages: [{ role: 'system', content: request.messages[0].content }, ...transcript],
            response_format: { type: 'json_object' }, max_tokens: maxTokens, stream: false, temperature: .15 }) })
      } catch (error) { transportError = error; throw error }
      const content = response.choices?.[0]?.message?.content
      onContent(typeof content === 'string' ? content.slice(0, 40000) : '')
      let value = {}
      if (response.choices?.[0]?.finish_reason !== 'length' && !response.choices?.[0]?.message?.refusal) {
        try { value = JSON.parse(content) } catch { /* Schema rejection triggers the app's single bounded repair. */ }
      }
      return { type: 'final', value }
    } },
  })
  const envelope = JSON.stringify(messages)
  const input = []
  // Bound each UTF-8 input part, including CJK and emoji, without truncating text.
  for (let i = 0; i < envelope.length; i += 24000) input.push({ type: 'text', text: envelope.slice(i, i + 24000) })
  try { return (await runner.run({ input }, { signal })).proposal }
  catch (error) {
    if (transportError instanceof AppError) throw transportError
    if (error instanceof RestrictedApplicationError && error.code === 'OUTPUT_INVALID') {
      throw Object.assign(new AppError('The reading guide was incomplete. Please retry.', 502), { repairable: true })
    }
    if (error instanceof RestrictedApplicationError && error.code === 'SENSITIVE_DATA') throw new AppError('Remove passwords or secret keys before sending this question.')
    if (error instanceof RestrictedApplicationError && ['CONTEXT_LIMIT', 'DATA_LIMIT', 'INVALID_INPUT'].includes(error.code)) throw new AppError('Choose a smaller reading selection.', 413)
    throw new AppError('The reading request could not finish. Please try again.', 502)
  }
}
