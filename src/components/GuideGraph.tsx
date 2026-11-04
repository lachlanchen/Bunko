import { useEffect, useId, useMemo, useState } from 'react'
import type { UILanguage } from '../i18n'
import type { GuideConnection, GuideEntity } from '../lib/bookCompanion'
import { relationshipLayout, connectionPath } from '../lib/guideLayout'
import { GuideCanvas } from './GuideCanvas'
import { guideVisualCopy } from './guideVisualCopy'

export function GuideGraph({ nodes, edges, ui, selected, onSelect, onEdge, label, guideKey }: {
  nodes: GuideEntity[]; edges: GuideConnection[]; ui: UILanguage; selected: string; onSelect: (id: string) => void; onEdge: (index: number) => void; label: string; guideKey: string
}) {
  const [tree, setTree] = useState(() => { try { const saved = sessionStorage.getItem(`bunko-guide-layout:${guideKey}`); if (saved) return saved === 'tree' } catch { /* Optional view. */ } return false }), [query, setQuery] = useState('')
  const chooseLayout = (value: boolean) => { setTree(value); try { sessionStorage.setItem(`bunko-guide-layout:${guideKey}`, value ? 'tree' : 'graph') } catch { /* Optional view. */ } }
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.innerWidth < 600)
  const [group, setGroup] = useState(() => { try { return sessionStorage.getItem(`bunko-guide-group:${guideKey}`) || '' } catch { return '' } })
  const chooseGroup = (value: string) => { setGroup(value); onSelect(''); try { sessionStorage.setItem(`bunko-guide-group:${guideKey}`, value) } catch { /* Optional view. */ } }
  const groups = [...new Set(nodes.map(n => n.group).filter((v): v is string => !!v))]
  useEffect(() => {
    if (!window.matchMedia) return
    const media = window.matchMedia('(max-width: 600px)'), update = () => setCompact(media.matches)
    media.addEventListener('change', update); return () => media.removeEventListener('change', update)
  }, [])
  const t = guideVisualCopy[ui], marker = useId().replace(/:/g, '')
  const adjacent = new Set([selected, ...edges.filter(e => e.from === selected || e.to === selected).flatMap(e => [e.from, e.to])])
  const graph = useMemo(() => {
    const neighbors = new Set([selected, ...edges.filter(e => e.from === selected || e.to === selected).flatMap(e => [e.from, e.to])])
    const visible = selected ? nodes.filter(n => neighbors.has(n.id)) : group ? nodes.filter(n => n.group === group) : nodes
    const ids = new Set(visible.map(n => n.id))
    return relationshipLayout(visible, edges.filter(e => ids.has(e.from) && ids.has(e.to)), tree, compact)
  }, [nodes, edges, tree, selected, compact, group])
  const found = nodes.filter(n => (!group || n.group === group) && `${n.name} ${n.aliases.join(' ')}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  return <>
    <div className="guide-visual-toolbar"><div className="guide-segmented">
      <button type="button" aria-pressed={!tree} onClick={() => chooseLayout(false)}>{t.graph}</button>
      <button type="button" aria-pressed={tree} onClick={() => chooseLayout(true)}>{t.tree}</button>
    </div><span>{nodes.length} · {edges.length} {t.connections}</span></div>
    {groups.length > 1 && <div className="guide-group-filter" aria-label={t.groups}>
      <button type="button" aria-pressed={!group} onClick={() => { chooseGroup('') }}>{t.all} · {nodes.length}</button>
      {groups.map(value => <button type="button" key={value} aria-pressed={group === value} onClick={() => { chooseGroup(value) }}>{value} · {nodes.filter(n => n.group === value).length}</button>)}
    </div>}
    <GuideCanvas key={`${tree}:${selected}:${compact}:${group}`} stateKey={`${guideKey}:${tree}:${selected}:${compact}:${group}`} initialFocus={graph.nodes.find(n => n.id === selected)} width={graph.width} height={graph.height} label={selected ? `${label} · ${nodes.find(n => n.id === selected)?.name || ''}` : group ? `${label} · ${group}` : label} ui={ui} footer={<p>{t.fullNames}</p>}>
      {scale => <><defs><marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" className="graph-arrow" /></marker></defs>
      {graph.edges.map(edge => {
        const dim = selected && edge.from !== selected && edge.to !== selected
        const path = connectionPath(edge.points)
        const activate = () => onEdge(edges.indexOf(edge.source))
        return <g key={edge.key} className={`graph-connection${dim ? ' dim' : ''}${edge.certainty === 'interpretation' ? ' inferred' : ''}`} role="button" tabIndex={0}
          aria-label={`${nodes.find(n => n.id === edge.from)?.name} — ${edge.label} — ${nodes.find(n => n.id === edge.to)?.name}`}
          onClick={activate} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate() } }}>
          <path className="graph-edge-hit" d={path} /><path className="graph-edge" d={path} markerEnd={edge.direction === 'forward' ? `url(#${marker})` : undefined} />
          {(scale >= .85 || graph.edges.length <= 6) && <><rect x={edge.x - edge.labelWidth / 2} y={edge.y - (edge.lines.length * 17 + 12) / 2} width={edge.labelWidth} height={edge.lines.length * 17 + 12} rx="8" />
          <text x={edge.x} y={edge.y - (edge.lines.length - 1) * 8.5} textAnchor="middle" dominantBaseline="middle">{edge.lines.map((line, i) => <tspan key={i} x={edge.x} dy={i ? 17 : 0}>{line}</tspan>)}</text></>}
        </g>
      })}
      {graph.nodes.map(node => {
        const activate = () => onSelect(node.id === selected ? '' : node.id)
        return <g key={node.id} transform={`translate(${node.x - node.width / 2},${node.y - node.height / 2})`}
          className={`graph-person tone-${node.color}${node.id === selected ? ' selected' : ''}${selected && !adjacent.has(node.id) ? ' dim' : ''}`}
          role="button" tabIndex={0} aria-pressed={node.id === selected} aria-label={node.name} onClick={activate}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate() } }}>
          <rect width={node.width} height={node.height} rx="15" /><rect className="graph-node-accent" x="0" y="14" width="4" height={node.height - 28} rx="2" />
          <text x={node.width / 2} y={node.height / 2 - (node.lines.length - 1) * 9.5} textAnchor="middle" dominantBaseline="middle">{node.lines.map((line, i) => <tspan key={i} x={node.width / 2} dy={i ? 19 : 0}>{line}</tspan>)}</text>
        </g>
      })}</>}
    </GuideCanvas>
    <input className="guide-search" aria-label={t.search} placeholder={t.search} value={query} onChange={e => setQuery(e.target.value)} />
    <div className="guide-name-index"><button type="button" aria-pressed={!selected} onClick={() => onSelect('')}>{t.all}</button>
      {found.map(node => <button type="button" key={node.id} aria-pressed={node.id === selected} onClick={() => onSelect(node.id === selected ? '' : node.id)}><bdi>{node.name}</bdi></button>)}
    </div>
  </>
}
