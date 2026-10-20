import './guideCompatibility'
import { Graph, layout } from '@dagrejs/dagre'
import type { GuideConnection, GuideEntity } from './bookCompanion'

/** SVG labels wrap without truncating names, including scripts without spaces. */
export function labelLines(value: string, width = 24): string[] {
  const lines: string[] = []
  let line = '', length = 0
  for (const word of value.split(/(\s+)/u)) {
    const size = [...word].reduce((n, c) => n + ((c.codePointAt(0) || 0) > 0x024f ? 1.7 : 1), 0)
    if (line && length + size > width && !/^\s+$/u.test(word)) { lines.push(line.trim()); line = ''; length = 0 }
    for (const c of word) {
      const unit = (c.codePointAt(0) || 0) > 0x024f ? 1.7 : 1
      if (length + unit > width) { if (line.trim()) lines.push(line.trim()); line = ''; length = 0 }
      if (!line && /\s/u.test(c)) continue
      line += c; length += unit
    }
  }
  if (line.trim()) lines.push(line.trim())
  return lines.length ? lines : ['']
}

function layoutComponent(nodes: GuideEntity[], edges: GuideConnection[], tree = false, compact = false) {
  const graph = new Graph({ multigraph: true })
  graph.setGraph({ rankdir: tree ? 'TB' : 'LR', ranksep: compact ? 52 : 82, nodesep: compact ? 24 : 44, edgesep: 28, marginx: compact ? 16 : 32, marginy: compact ? 16 : 32 })
  graph.setDefaultEdgeLabel(() => ({}))
  // Opaque internal keys avoid reserved/property-like model IDs in graphlib.
  const ids = new Map(nodes.map((n, i) => [n.id, `node${i}`]))
  const rows = nodes.map((node, i) => {
    const lines = labelLines(node.name, compact ? 17 : 23), height = Math.max(64, lines.length * 19 + 34), width = compact ? 140 : 188
    graph.setNode(`node${i}`, { width, height })
    return { ...node, lines, width, height, color: i % 6 }
  })
  const links = edges.flatMap((edge, i) => {
    const from = ids.get(edge.from), to = ids.get(edge.to)
    if (!from || !to || from === to) return []
    const lines = labelLines(edge.label, compact ? 16 : 22), labelWidth = compact ? 116 : 154
    graph.setEdge(from, to, { width: labelWidth, height: lines.length * 17 + 16, labelpos: 'c' }, `edge${i}`)
    return [{ ...edge, source: edge, lines, labelWidth, fromKey: from, toKey: to, key: `edge${i}`, index: i }]
  })
  layout(graph)
  return {
    width: Math.max(260, graph.graph().width || 0), height: Math.max(200, graph.graph().height || 0),
    nodes: rows.map((row, i) => ({ ...row, x: graph.node(`node${i}`).x, y: graph.node(`node${i}`).y })),
    edges: links.map(row => ({ ...row, ...(graph.edge({ v: row.fromKey, w: row.toKey, name: row.key }) as { x: number; y: number; points: { x: number; y: number }[] }) })),
  }
}


/** Pack independent groups instead of producing one unreadable, very long rank. */
export function relationshipLayout(nodes: GuideEntity[], edges: GuideConnection[], tree = false, compact = false) {
  const pending = new Set(nodes.map(n => n.id)), groups: ReturnType<typeof layoutComponent>[] = []
  while (pending.size) {
    const queue = [pending.values().next().value!], members = new Set<string>()
    while (queue.length) {
      const id = queue.pop()!
      if (!pending.delete(id)) continue
      members.add(id)
      for (const edge of edges) {
        if (edge.from === id && pending.has(edge.to)) queue.push(edge.to)
        if (edge.to === id && pending.has(edge.from)) queue.push(edge.from)
      }
    }
    groups.push(layoutComponent(nodes.filter(n => members.has(n.id)), edges.filter(e => members.has(e.from) && members.has(e.to)), tree, compact))
  }
  if (!groups.length) return layoutComponent([], [], tree)
  const gap = 24, target = Math.max(...groups.map(g => g.width), Math.sqrt(groups.reduce((a, g) => a + (g.width + gap) * (g.height + gap), 0)) * 1.15)
  let x = 0, y = 0, rowHeight = 0, width = 0
  const result = { width: 260, height: 200, nodes: [] as ReturnType<typeof layoutComponent>['nodes'], edges: [] as ReturnType<typeof layoutComponent>['edges'] }
  for (const group of groups.sort((a, b) => b.height - a.height)) {
    if (x && x + group.width > target) { x = 0; y += rowHeight + gap; rowHeight = 0 }
    result.nodes.push(...group.nodes.map(n => ({ ...n, color: nodes.findIndex(row => row.id === n.id) % 6, x: n.x + x, y: n.y + y })))
    result.edges.push(...group.edges.map(e => ({ ...e, key: `edge${result.edges.length}-${e.key}`, x: e.x + x, y: e.y + y, points: e.points.map(p => ({ x: p.x + x, y: p.y + y })) })))
    width = Math.max(width, x + group.width); rowHeight = Math.max(rowHeight, group.height); x += group.width + gap
  }
  result.width = Math.max(260, width); result.height = Math.max(200, y + rowHeight)
  return result
}
