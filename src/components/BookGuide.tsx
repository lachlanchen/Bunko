import { useState } from 'react'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import type { UILanguage } from '../i18n'
import type { BookCitation, BookResponse, GuideConnection, GuideEntity } from '../lib/bookCompanion'
import { bookCompanionCopy } from './bookCompanionCopy'
import './bookCompanion.css'

export function PassageEvidence({ citations, ui, onRead }: { citations: BookCitation[]; ui: UILanguage; onRead: (paragraph: number, citation?: BookCitation) => void }) {
  const t = bookCompanionCopy[ui]
  if (!citations.length) return null
  return <details className="guide-evidence"><summary><BookOpen size={14} />{t.evidence} · {citations.map(c => c.passage).join(', ')}</summary>
    {citations.map((c, i) => <blockquote key={`${c.passage}:${i}`}><p dir="auto">{c.quote}</p><button type="button" onClick={() => onRead(c.paragraph, c)}>{t.source} · {c.passage}<ArrowUpRight size={14} /></button></blockquote>)}
  </details>
}

function Connections({ nodes, edges, ui, onRead, kind }: { nodes: GuideEntity[]; edges: GuideConnection[]; ui: UILanguage; onRead: (paragraph: number, citation?: BookCitation) => void; kind: 'people' | 'places' }) {
  const [focused, setFocused] = useState('')
  const t = bookCompanionCopy[ui]
  const selected = nodes.find(n => n.id === focused)
  const positions = nodes.map((_, i) => {
    const angle = -Math.PI / 2 + i * 2 * Math.PI / nodes.length
    return { x: 300 + Math.cos(angle) * 220, y: 180 + Math.sin(angle) * 125 }
  })
  const shown = selected ? nodes.filter(n => n.id === selected.id) : nodes
  return <>
    {nodes.length > 1 && edges.length > 0 && <div className={`guide-diagram ${kind}`}>
      <svg viewBox="0 0 600 360" role="img" aria-label={kind === 'places' ? t.schematic : t.people}>
        <title>{kind === 'places' ? t.schematic : t.people}</title>
        {edges.map((edge, i) => {
          const a = positions[nodes.findIndex(n => n.id === edge.from)], b = positions[nodes.findIndex(n => n.id === edge.to)]
          if (!a || !b) return null
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`${edge.certainty === 'interpretation' ? 'inferred' : ''}${selected && edge.from !== selected.id && edge.to !== selected.id ? ' dim' : ''}`} />
        })}
        {nodes.map((node, i) => <g key={node.id} transform={`translate(${positions[i].x},${positions[i].y})`} className={node.id === focused ? 'selected' : ''}>
          <circle r="25" /><text textAnchor="middle" dominantBaseline="central">{i + 1}</text>
          <text className="guide-node-name" y="45" textAnchor="middle">{node.name.length > 22 ? `${node.name.slice(0, 20)}…` : node.name}</text>
        </g>)}
      </svg>
      {kind === 'places' && <p>{t.schematic}</p>}
    </div>}
    {nodes.length > 1 && <div className="guide-name-index" aria-label={kind === 'places' ? t.places : t.people}>
      {nodes.map((node, i) => <button type="button" key={node.id} aria-pressed={node.id === focused} onClick={() => setFocused(focused === node.id ? '' : node.id)}><span>{i + 1}</span><bdi>{node.name}</bdi></button>)}
    </div>}
    <div className="guide-entity-grid">
      {shown.map(node => <article key={node.id} className="guide-card">
        <h2 dir="auto">{node.name}</h2>
        {!!node.aliases.length && <p className="guide-aliases" dir="auto">{node.aliases.join(' · ')}</p>}
        <p dir="auto">{node.detail}</p>
        {node.certainty === 'interpretation' && <span className="guide-uncertain">{t.interpretation}</span>}
        <PassageEvidence citations={node.citations} ui={ui} onRead={onRead} />
      </article>)}
    </div>
    <div className="guide-connections">
      {edges.filter(e => !selected || e.from === selected.id || e.to === selected.id).map((edge, i) => <article key={i} className="guide-connection">
        <h3><bdi>{nodes.find(n => n.id === edge.from)?.name}</bdi><span aria-hidden="true">{kind === 'places' ? '→' : '↔'}</span><bdi>{nodes.find(n => n.id === edge.to)?.name}</bdi></h3>
        <p dir="auto">{edge.label}</p>
        {edge.certainty === 'interpretation' && <span className="guide-uncertain">{t.interpretation}</span>}
        <PassageEvidence citations={edge.citations} ui={ui} onRead={onRead} />
      </article>)}
    </div>
  </>
}

export function BookGuide({ guide, tab, ui, onRead }: { guide: BookResponse; tab: 'people' | 'places' | 'timeline'; ui: UILanguage; onRead: (paragraph: number, citation?: BookCitation) => void }) {
  const t = bookCompanionCopy[ui]
  const entries = tab === 'timeline' ? guide.events : guide[tab]
  return <section className="book-guide">
    {(guide.coverage.partial || guide.coverage.scope === 'chapter') && <p className="guide-coverage">{t.coverage} {guide.coverage.first + 1}–{guide.coverage.last + 1}{guide.coverage.partial ? ` · ${t.partial}` : ''}</p>}
    {!entries?.length ? <p className="guide-empty">{t.empty}</p> : tab === 'timeline' ? <>
      <p className="guide-caption">{t.textOrder}</p>
      <ol className="guide-timeline">{guide.events?.map((event, i) => <li key={i}>
        <span className="guide-time">{event.when || t.undated}</span>
        <article className="guide-card"><h2 dir="auto">{event.title}</h2><p dir="auto">{event.detail}</p>
          {event.certainty === 'interpretation' && <span className="guide-uncertain">{t.interpretation}</span>}
          <PassageEvidence citations={event.citations} ui={ui} onRead={onRead} />
        </article>
      </li>)}</ol>
    </> : <Connections key={`${guide.key}:${tab}`} nodes={guide[tab] || []} edges={(tab === 'people' ? guide.relationships : guide.routes) || []} kind={tab} ui={ui} onRead={onRead} />}
    <p className="guide-caption">{t.ai}</p>
  </section>
}
