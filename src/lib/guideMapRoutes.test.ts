import { expect, it } from 'vitest'
import { mapRouteGaps } from './guideMapRoutes'
import type { GuideConnection } from './bookCompanion'
const edge = (from: string, to: string, direction: 'forward' | 'mutual' = 'forward'): GuideConnection => ({ from, to, direction, label: `${from} to ${to}`, certainty: 'background', citations: [] })
it('bridges only explicit directed journeys and retains every missing stop and source edge', () => {
  const edges = [edge('a', 'x'), edge('x', 'y'), edge('y', 'b'), edge('b', 'c'), edge('x', 'z'), edge('z', 'd')]
  expect(mapRouteGaps(edges, new Set(['a', 'b', 'c', 'd']))).toEqual([
    { from: 'a', to: 'b', via: ['x', 'y'], edges: [0, 1, 2] },
    { from: 'a', to: 'd', via: ['x', 'z'], edges: [0, 4, 5] },
  ])
  expect(mapRouteGaps(edges, new Set(['b', 'c']))).toEqual([])
})
it('does not join unrelated nodes, reverse symmetric relations, or loop forever', () => {
  expect(mapRouteGaps([edge('a','x'), edge('x','a'), edge('x','y'), edge('y','x'), edge('y','b','mutual')], new Set(['a','b']))).toEqual([])
  const dense = Array.from({length: 24},(_,i)=>edge(`n${i}`,`n${(i+1)%24}`))
  expect(mapRouteGaps(dense,new Set(['n0']))).toEqual([])
})
