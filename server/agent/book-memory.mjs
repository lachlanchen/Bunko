import { bookRelevance } from './book-relevance.mjs'

export const visualGroups = { people: ['people', 'relationships'], places: ['places', 'routes'], timeline: ['events'] }

export function readingBranch(messages, reference, parentId, fresh = false) {
  const available = messages.filter(m => m.state === 'completed' && m.bookResponse?.reference?.id === reference.id)
  const byId = new Map(available.map(m => [m.id, m]))
  let parent = fresh ? undefined : parentId ? byId.get(parentId) : [...available].reverse().sort((a, b) => bookRelevance(a.bookResponse.reference, reference) - bookRelevance(b.bookResponse.reference, reference))[0]
  const branch = [], seen = new Set()
  while (parent && !seen.has(parent.id) && branch.length < available.length) {
    seen.add(parent.id); branch.unshift(parent)
    parent = parent.parentId ? byId.get(parent.parentId) : undefined
  }
  return branch
}

/** Only selected ancestors enter memory. An unrelated later turn cannot hijack a branch. */
export function readingMemory(branch) {
  const visuals = {}
  for (const message of branch) for (const response of [message.baseGuide, message.bookResponse].filter(Boolean)) for (const [view, fields] of Object.entries(visualGroups)) {
    if (!fields.some(field => Array.isArray(response[field]))) continue
    visuals[view] = { reference: response.reference, ...(view === 'places' && response.mapYear !== undefined ? { mapYear: response.mapYear } : {}),
      ...Object.fromEntries(fields.map(field => [field, (response[field] || []).map(entry => {
        // Old quotations are not fresh evidence. Unchanged views retain their original
        // verified citations in storage; newly emitted claims must use current sources.
        const { citations: _citations, ...facts } = entry
        return facts
      })])) }
  }
  return { visuals, history: branch.slice(-6).flatMap(m => [{ role: 'user', content: m.question.slice(0, 2000) },
    { role: 'assistant', content: JSON.stringify({ answer: m.answer.slice(0, 3000), reference: m.bookResponse.reference, knowledge: m.bookResponse.knowledge || 'passages' }) }]) }
}
