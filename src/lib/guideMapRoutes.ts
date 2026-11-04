import type { GuideConnection } from './bookCompanion'

/** Follow explicit directed edges across unlocated stops. Never infer list order,
 * reverse a journey, or invent positions for intermediate places. */
export function mapRouteGaps(edges: GuideConnection[], located: Set<string>) {
  const result: { from: string; to: string; via: string[]; edges: number[] }[] = []
  let remaining = 512
  const walk = (from: string, at: string, via: string[], path: number[], seen: Set<string>) => {
    if (--remaining < 0 || seen.has(at)) return
    if (located.has(at)) {
      if (via.length) result.push({ from, to: at, via, edges: path })
      return
    }
    const next = new Set([...seen, at])
    edges.forEach((edge, index) => {
      if (edge.direction === 'forward' && edge.from === at) walk(from, edge.to, [...via, at], [...path, index], next)
    })
  }
  edges.forEach((edge, index) => {
    if (edge.direction === 'forward' && located.has(edge.from) && !located.has(edge.to)) walk(edge.from, edge.to, [], [index], new Set([edge.from]))
  })
  return result
}
