import { nearestReadingTip } from './book-relevance.mjs'
import { visualGroups, stableEntries } from './reading-updates.mjs'
export { visualGroups } from './reading-updates.mjs'

export function readingBranch(messages, reference, parentId, fresh = false) {
  const available = messages.filter(m => m.state === 'completed' && m.bookResponse?.reference?.id === reference.id)
  const byId = new Map(available.map(m => [m.id, m]))
  let parent = fresh ? undefined : parentId ? byId.get(parentId) : nearestReadingTip([...available].reverse().map(m => ({ ...m, reference: m.bookResponse.reference })), reference)
  const branch = [], seen = new Set()
  while (parent && !seen.has(parent.id) && branch.length < available.length) {
    seen.add(parent.id); branch.unshift(parent)
    parent = parent.parentId ? byId.get(parent.parentId) : undefined
  }
  return branch
}

/** Only selected ancestors enter memory. An unrelated later turn cannot hijack a branch. */
export function readingMemory(branch) {
  const visuals = {}, snapshots = {}
  let lastView
  for (const message of branch) for (const response of [message.baseGuide, message.bookResponse].filter(Boolean)) for (const [view, fields] of Object.entries(visualGroups)) {
    if (!fields.some(field => Array.isArray(response[field]))) continue
    lastView = view
    snapshots[view] = { reference: response.reference, ...(view === 'places' && response.mapYear !== undefined ? { mapYear: response.mapYear } : {}),
      ...Object.fromEntries(fields.map(field => [field, stableEntries(field, response[field] || [], response.reference)])) }
    visuals[view] = { ...snapshots[view],
      ...Object.fromEntries(fields.map(field => [field, snapshots[view][field].map(entry => {
        // Old quotations are not fresh evidence. Unchanged views retain their original
        // verified citations in storage; newly emitted claims must use current sources.
        const { citations: _citations, ...facts } = entry
        return facts
      })])) }
  }
  return { visuals, snapshots, lastView, history: branch.slice(-6).flatMap(m => [{ role: 'user', content: m.question.slice(0, 2000) },
    { role: 'assistant', content: `Earlier answer (conversation memory, not the response format):\n${m.answer.slice(0, 3000)}` }]) }
}
