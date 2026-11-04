import { expect, it } from 'vitest'
import { installGuideCompatibility } from './guideCompatibility'
import { relationshipLayout } from './guideLayout'

it('lays out a cyclic graph without modern WebKit builtins and preserves native implementations', () => {
  const own = Object.getOwnPropertyDescriptor(Object, 'hasOwn')!, clone = Object.getOwnPropertyDescriptor(globalThis, 'structuredClone')!
  installGuideCompatibility()
  expect(Object.hasOwn).toBe(own.value); expect(globalThis.structuredClone).toBe(clone.value)
  try {
    Object.defineProperty(Object, 'hasOwn', { ...own, value: undefined })
    Object.defineProperty(globalThis, 'structuredClone', { ...clone, value: undefined })
    installGuideCompatibility()
    expect(Object.hasOwn(Object.create({ inherited: true }), 'inherited')).toBe(false)
    expect(Object.hasOwn({ hasOwnProperty: 1 }, 'hasOwnProperty')).toBe(true)
    const original: { self?: unknown; points: Map<string, number> } = { points: new Map([['x', 1]]) }; original.self = original
    const copied = structuredClone(original)
    expect(copied).not.toBe(original); expect(copied.self).toBe(copied); expect(copied.points.get('x')).toBe(1)
    const nodes = ['a', 'b', 'c'].map(id => ({ id, name: id, detail: '', aliases: [], certainty: 'stated' as const, citations: [] }))
    const edges = nodes.map((node, i) => ({ from: node.id, to: nodes[(i + 1) % 3].id, label: 'Related', certainty: 'stated' as const, citations: [] }))
    const graph = relationshipLayout(nodes, edges)
    expect(graph.nodes).toHaveLength(3); expect(graph.edges.every(e => Number.isFinite(e.x))).toBe(true)
    expect(() => structuredClone(new ArrayBuffer(1), { transfer: [new ArrayBuffer(1)] })).toThrow('Transfer is unavailable')
  } finally {
    Object.defineProperty(Object, 'hasOwn', own); Object.defineProperty(globalThis, 'structuredClone', clone)
  }
})
