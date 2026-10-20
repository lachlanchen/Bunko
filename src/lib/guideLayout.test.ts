import { describe, expect, it } from 'vitest'
import { labelLines, relationshipLayout } from './guideLayout'
import { findPlaces, suggestedPlace } from './guideAtlas'
import type { GuideConnection, GuideEntity } from './bookCompanion'
const entity = (id: string, name = id): GuideEntity => ({ id, name, detail: '', aliases: [], certainty: 'stated', citations: [] })
describe('complete graph layout', () => {
  it('keeps full long and multilingual names without overlapping nodes, including cycles and disconnected people', () => {
    const nodes = Array.from({ length: 32 }, (_, i) => entity(i === 0 ? '__proto__' : `person${i}`, i % 2 ? '源氏と複数の長い名前が続く登場人物' : `An unusually long complete character name ${i}`))
    const edges = nodes.slice(1, 25).map((n, i) => ({ from: nodes[i].id, to: n.id, label: 'A clearly labelled relationship', certainty: 'stated' as const, citations: [] }))
    edges.push({ ...edges[0], from: nodes[20].id, to: nodes[0].id })
    for (const tree of [false, true]) {
      const graph = relationshipLayout(nodes, edges, tree)
      expect(graph.nodes).toHaveLength(32); expect(graph.edges).toHaveLength(25)
      for (const n of graph.nodes) {
        expect(n.lines.join('').replace(/\s/g, '')).toBe(n.name.replace(/\s/g, ''))
        expect(n.x - n.width / 2).toBeGreaterThanOrEqual(0); expect(n.y - n.height / 2).toBeGreaterThanOrEqual(0)
        expect(n.x + n.width / 2).toBeLessThanOrEqual(graph.width); expect(n.y + n.height / 2).toBeLessThanOrEqual(graph.height)
        for (const other of graph.nodes) if (other !== n) expect(Math.abs(n.x - other.x) >= (n.width + other.width) / 2 || Math.abs(n.y - other.y) >= (n.height + other.height) / 2).toBe(true)
      }
      expect(graph.edges.every(e => e.points.length >= 2 && Number.isFinite(e.x) && Number.isFinite(e.y))).toBe(true)
    }
    expect(labelLines('👩🏽‍🔬 researcher')).not.toContain('…')
  })
  it('keeps parallel relationships and ignores invalid endpoints without creating ghost people', () => {
    const edge = { from: 'a', to: 'b', label: 'Siblings', certainty: 'stated' as const, citations: [] }
    const graph = relationshipLayout([entity('a'), entity('b')], [edge, { ...edge, label: 'Colleagues' }, { ...edge, to: 'missing' }])
    expect(graph.nodes).toHaveLength(2); expect(graph.edges).toHaveLength(2)
  })
  it('packs disconnected names and retains the exact source edge when labels repeat', () => {
    const nodes = Array.from({ length: 24 }, (_, i) => entity(`n${i}`))
    const isolated = relationshipLayout(nodes, [], true, true)
    expect(Math.max(isolated.width / isolated.height, isolated.height / isolated.width)).toBeLessThan(2)
    const edges: GuideConnection[] = [0, 1].map(i => ({ from: 'n0', to: 'n1', label: 'Same label', certainty: 'stated', citations: [{ passage: `P${i + 1}`, paragraph: i, quote: 'Different evidence' }] }))
    const graph = relationshipLayout(nodes, edges, true, true)
    expect(graph.edges.map(e => edges.indexOf(e.source)).sort()).toEqual([0, 1])
  })
})
describe('offline geographic references', () => {
  it('finds source-language names and retains ambiguity instead of inventing a location', () => {
    expect(findPlaces('東京', true).some(p => p.country === 'Japan')).toBe(true)
    expect(findPlaces('北京', true).some(p => p.country === 'China')).toBe(true)
    expect(findPlaces('London', true).length).toBeGreaterThan(1)
    expect(suggestedPlace(['London'])).toBeNull()
    expect(suggestedPlace(['The invented mountain kingdom of mist'])).toBeNull()
    expect(findPlaces('')).toEqual([])
  })
})
