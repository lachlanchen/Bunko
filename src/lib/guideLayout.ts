import './guideCompatibility'
import { Graph, layout } from '@dagrejs/dagre'
import type { GuideConnection, GuideEntity } from './bookCompanion'
const nodeColor = (id: string) => [...id].reduce((color, char) => (color * 31 + char.codePointAt(0)!) % 6, 0)

/** Rounded routed bends preserve the graph's exact endpoints. */
export function connectionPath(points: { x: number; y: number }[]) {
  if (!points.length) return ''
  let path = `M${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1], b = points[i], c = points[i + 1]
    const before = Math.hypot(b.x - a.x, b.y - a.y), after = Math.hypot(c.x - b.x, c.y - b.y)
    if (!before || !after) continue
    const radius = Math.min(14, before / 2, after / 2)
    path += `L${b.x + (a.x - b.x) * radius / before},${b.y + (a.y - b.y) * radius / before}Q${b.x},${b.y} ${b.x + (c.x - b.x) * radius / after},${b.y + (c.y - b.y) * radius / after}`
  }
  const last = points.at(-1)!
  return `${path}L${last.x},${last.y}`
}

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
  edges = edges.filter(e => e.from !== e.to && nodes.some(n => n.id === e.from) && nodes.some(n => n.id === e.to))
  // A faction/family with one main connector reads better as a compact circle
  // than one extremely wide rank of leaves. This changes layout only, never edges.
  const hub = [...nodes].sort((a, b) => edges.filter(e => e.from === b.id || e.to === b.id).length - edges.filter(e => e.from === a.id || e.to === a.id).length)[0]
  if (!tree && nodes.length >= 5 && nodes.length <= 14 && nodes.every(n => labelLines(n.name, 12).length <= 2) && edges.length <= nodes.length * 1.5 && edges.filter(e => e.from === hub.id || e.to === hub.id).length >= nodes.length - 2) {
    const radius = Math.max(185, (nodes.length - 1) * 20), center = radius + 78, others = nodes.filter(n => n.id !== hub.id)
    const rows = nodes.map(node => {
      const angle = others.indexOf(node) * Math.PI * 2 / others.length - Math.PI / 2
      return { ...node, lines: labelLines(node.name, 12), width: 108, height: 64, color: nodeColor(node.group || node.id),
        x: node === hub ? center : center + Math.cos(angle) * radius, y: node === hub ? center : center + Math.sin(angle) * radius }
    })
    const links = edges.map((edge, i) => {
      const from = rows.find(n => n.id === edge.from)!, to = rows.find(n => n.id === edge.to)!
      const dx = to.x - from.x, dy = to.y - from.y
      const trim = Math.min(54 / Math.max(.001, Math.abs(dx)), 32 / Math.max(.001, Math.abs(dy)))
      return { ...edge, source: edge, lines: labelLines(edge.label, 14), labelWidth: 108, fromKey: edge.from, toKey: edge.to, key: `edge${i}`, index: i,
        x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, points: [{ x: from.x + dx * trim, y: from.y + dy * trim }, { x: to.x - dx * trim, y: to.y - dy * trim }] }
    })
    return { width: center * 2, height: center * 2, nodes: rows, edges: links }
  }
  const graph = new Graph({ multigraph: true })
  graph.setGraph({ rankdir: tree ? 'TB' : 'LR', ranksep: compact ? 52 : 82, nodesep: compact ? 24 : 44, edgesep: 28, marginx: compact ? 16 : 32, marginy: compact ? 16 : 32 })
  graph.setDefaultEdgeLabel(() => ({}))
  // Opaque internal keys avoid reserved/property-like model IDs in graphlib.
  const ids = new Map(nodes.map((n, i) => [n.id, `node${i}`]))
  const rows = nodes.map((node, i) => {
    const lines = labelLines(node.name, compact ? 17 : 23), height = Math.max(64, lines.length * 19 + 34), width = compact ? 140 : 188
    graph.setNode(`node${i}`, { width, height })
    return { ...node, lines, width, height, color: nodeColor(node.group || node.id) }
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
    result.nodes.push(...group.nodes.map(n => ({ ...n, x: n.x + x, y: n.y + y })))
    result.edges.push(...group.edges.map(e => ({ ...e, key: `edge${result.edges.length}-${e.key}`, x: e.x + x, y: e.y + y, points: e.points.map(p => ({ x: p.x + x, y: p.y + y })) })))
    width = Math.max(width, x + group.width); rowHeight = Math.max(rowHeight, group.height); x += group.width + gap
  }
  result.width = Math.max(260, width); result.height = Math.max(200, y + rowHeight)
  return result
}
