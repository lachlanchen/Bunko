import { createRestrictedApplicationRunner, RestrictedApplicationError } from '../vendor/agintilite/src/restricted-application.js'
import { AppError } from './common.mjs'

const string = maxLength => ({ type: 'string', maxLength })
const array = (items, maxItems) => ({ type: 'array', items, maxItems })
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false })
const citations = array(object({ passage: string(40), quote: string(600) }), 5)
const certainty = { type: 'string', enum: ['stated', 'interpretation', 'background'], maxLength: 20 }
const entity = object({ id: string(40), name: string(120), detail: string(600), aliases: array(string(120), 6), certainty, citations }, ['id', 'name', 'detail', 'citations'])
const edge = object({ from: string(120), to: string(120), label: string(160), direction: { type: 'string', enum: ['forward', 'mutual'], maxLength: 10 }, certainty, citations }, ['from', 'to', 'label', 'citations'])
const event = object({ title: string(160), when: string(120), detail: string(600), certainty, citations }, ['title', 'detail', 'citations'])
const guideFields = { people: array(entity, 32), relationships: array(edge, 64), places: array(entity, 24), routes: array(edge, 32), events: array(event, 48) }
export const answerSchema = object({ answer: string(20000), knowledge: { type: 'string', enum: ['passages', 'background', 'mixed'], maxLength: 20 }, insufficient: { type: 'boolean' }, citations, ...guideFields }, ['answer', 'citations'])
export const guideSchema = object(answerSchema.properties, ['answer', 'citations', 'people', 'relationships', 'places', 'routes', 'events'])

// Some JSON-mode providers emit literal Markdown newlines inside JSON strings.
// Escape only those control characters: preserve the text, quotes and structure.
// Never complete truncated objects, drop fields or invent missing evidence.
function parseReadingJSON(content) {
  if (typeof content !== 'string') throw new SyntaxError('Missing JSON text')
  try { return JSON.parse(content) } catch { /* Try lossless string escaping only. */ }
  let quoted = false, escaped = false, normalized = ''
  for (const char of content) {
    if (quoted && !escaped && char.charCodeAt(0) < 32) {
      normalized += `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
      continue
    }
    normalized += char
    if (escaped) escaped = false
    else if (quoted && char === '\\') escaped = true
    else if (char === '"') quoted = !quoted
  }
  return JSON.parse(normalized)
}

// Give the bounded repair actionable schema paths, without echoing model text.
function schemaIssues(value, schema, path = '$', issues = []) {
  if (issues.length >= 12) return issues
  const add = message => { if (issues.length < 12) issues.push(`${path}: ${message}`) }
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) add('expected object')
    else {
      for (const key of schema.required) if (!Object.hasOwn(value, key)) add(`missing ${key}`)
      for (const key of Object.keys(value)) {
        if (Object.hasOwn(schema.properties, key)) schemaIssues(value[key], schema.properties[key], `${path}.${key}`, issues)
        else add(`unexpected field${/^[A-Za-z][A-Za-z0-9_]{0,40}$/.test(key) ? ` ${key}` : ''}; use only the specified fields, with visual arrays at the root rather than inside a wrapper`)
      }
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value)) add('expected array')
    else if (value.length > schema.maxItems) add(`maximum ${schema.maxItems} entries; retain only edges whose endpoints remain`)
    else value.forEach((item, i) => schemaIssues(item, schema.items, `${path}[${i}]`, issues))
  } else if (typeof value !== schema.type) add(`expected ${schema.type}`)
  else if (schema.type === 'string' && Array.from(value).length > schema.maxLength) add(`maximum ${schema.maxLength} characters`)
  if (schema.enum && !schema.enum.includes(value)) add(`choose ${schema.enum.join(' / ')}`)
  return issues
}

/** The app retrieves the authorized public passages deterministically, then uses
 * AgInTiLite as a bounded structured task. No model turn is spent choosing an
 * account, book scope or retrieval tool. Those remain host authority.
 * The generic Lite tool loop is available for future qualified read-only tools.
 */
export async function runStructuredReading({ messages, kind, focus = 'chat', complete, url, timeoutMs, maxTokens, onContent = () => {}, signal, repairAttempt = 0 }) {
  let transportError, repairHint
  const requiredView = { people: ['people', 'relationships'], places: ['places', 'routes'], timeline: ['events'] }[focus] || []
  const schema = kind === 'guide' ? guideSchema : kind === 'explore' ? object(answerSchema.properties, ['answer', 'citations', ...requiredView]) : answerSchema
  const runner = createRestrictedApplicationRunner({
    instructions: 'Bunko supplies a scoped reading transcript as data. Return a structured reading proposal. The host verifies every source citation before saving or displaying it.',
    tools: [],
    outputSchema: schema,
    limits: { timeoutMs, maxSteps: 1, maxToolCalls: 1, maxConcurrency: 1, maxOutputTokens: maxTokens, maxContextBytes: 512 * 1024, maxResultBytes: 128 * 1024 },
    provider: { supportsImages: false, complete: async (request, options) => {
      // Reassemble the host transcript from the SDK's detached, checked input.
      const transcript = JSON.parse(request.messages.at(-1).content.map(part => part.text).join(''))
      let response
      try {
        response = await complete(url, { method: 'POST', signal: options.signal, timeout: timeoutMs, quality: repairAttempt ? 'repair' : 'standard',
          body: JSON.stringify({ messages: [{ role: 'system', content: `${request.messages[0].content}\nReturn the JSON value itself, not an envelope. Required output contract: ${JSON.stringify(request.outputSchema)}` }, ...transcript],
            response_format: { type: 'json_object' }, max_tokens: maxTokens, stream: false, temperature: .15 }) })
      } catch (error) { transportError = error; throw error }
      const content = response.choices?.[0]?.message?.content
      onContent(typeof content === 'string' ? content.slice(0, 40000) : '')
      let value = {}
      if (response.choices?.[0]?.finish_reason === 'length') repairHint = kind === 'answer' ? 'Output was truncated. Return ONLY answer, knowledge, insufficient and citations. Keep answer under 700 words; omit all guide arrays and the type field.' : 'Output was truncated. Return compact complete requested visual groups: at most 16 people, 24 relationships, 10 places, 8 routes, 16 events, one short quote per entry and a short summary. Omit unrequested groups for EXPLORE.'
      if (response.choices?.[0]?.finish_reason !== 'length' && !response.choices?.[0]?.message?.refusal) {
        try { value = parseReadingJSON(content) } catch {
          repairHint = 'Return one complete valid JSON object. Escape newlines, tabs, backslashes and double quotes inside string values. No Markdown fences or trailing text.'
        }
      }
      if (!repairHint) repairHint = schemaIssues(value, schema).join('; ')
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
      throw Object.assign(new AppError(kind === 'guide' ? 'The reading guide could not be completed. Please retry.' : 'The reading answer could not be completed. Please retry.', 502), { repairable: true, ...(repairHint ? { repairDetails: repairHint } : {}) })
    }
    if (error instanceof RestrictedApplicationError && error.code === 'SENSITIVE_DATA') throw new AppError('Remove passwords or secret keys before sending this question.')
    if (error instanceof RestrictedApplicationError && ['CONTEXT_LIMIT', 'DATA_LIMIT', 'INVALID_INPUT'].includes(error.code)) throw new AppError('Choose a smaller reading selection.', 413)
    throw new AppError('The reading request could not finish. Please try again.', 502)
  }
}
