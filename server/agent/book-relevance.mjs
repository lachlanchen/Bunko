/** Lower values are nearer. Scope outranks recency; recency breaks ties. */
export function bookRelevance(candidate, current) {
  if (!candidate || candidate.id !== current.id || candidate.replyLanguage !== current.replyLanguage) return Infinity
  if (current.scope === 'book') return candidate.scope === 'book' ? 0 : 100 + Math.abs(candidate.chapter - current.chapter)
  if (candidate.file === current.file) {
    if (candidate.scope === current.scope && candidate.paragraph === current.paragraph && (candidate.quote || '') === (current.quote || '')) return 0
    if (candidate.scope === 'book') return 30
    if (candidate.scope === 'chapter') return 10
    const distance = Math.abs(candidate.paragraph - current.paragraph)
    return 1 + 8 * distance / (distance + 100)
  }
  if (candidate.scope === 'book') return 30
  return 40 + Math.abs(candidate.chapter - current.chapter) + (candidate.chapter > current.chapter ? .5 : 0)
}

/** Rank conversation branches by their nearest bookmark, then resume the newest
 * tip of that branch. A sole conversation remains useful anywhere in the book. */
export function nearestReadingTip(rows, current) {
  const available = rows.filter(row => Number.isFinite(bookRelevance(row.reference, current)))
  const byId = new Map(available.map(row => [row.id, row]))
  const parents = new Set(available.map(row => row.parentId).filter(Boolean))
  const tips = available.filter(row => !parents.has(row.id))
  const score = tip => {
    let best = Infinity, row = tip
    const seen = new Set()
    while (row && !seen.has(row.id)) {
      seen.add(row.id); best = Math.min(best, bookRelevance(row.reference, current))
      row = byId.get(row.parentId)
    }
    return best
  }
  // Callers supply newest first, making equal-distance selection deterministic.
  return tips.sort((a, b) => score(a) - score(b))[0]
}
