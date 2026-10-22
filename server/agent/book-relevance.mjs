/** Lower values are nearer. Scope outranks recency; recency breaks ties. */
export function bookRelevance(candidate, current) {
  if (!candidate || candidate.id !== current.id || candidate.replyLanguage !== current.replyLanguage) return Infinity
  if (current.scope === 'book') return candidate.scope === 'book' ? 0 : 100 + Math.abs(candidate.chapter - current.chapter)
  if (candidate.file === current.file) {
    if (candidate.scope === current.scope && candidate.paragraph === current.paragraph && (candidate.quote || '') === (current.quote || '')) return 0
    if (candidate.scope === 'book') return 30
    if (candidate.scope === 'chapter') return 10
    return 1 + Math.min(8, Math.abs(candidate.paragraph - current.paragraph) / 100)
  }
  if (candidate.scope === 'book') return 30
  return 40 + Math.abs(candidate.chapter - current.chapter) + (candidate.chapter > current.chapter ? .5 : 0)
}
