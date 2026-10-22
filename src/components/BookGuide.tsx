import { lazy, Suspense, useRef, useState } from 'react'
import type { UILanguage } from '../i18n'
import type { BookCitation, BookResponse, GuideConnection, GuideEntity } from '../lib/bookCompanion'
import { bookCompanionCopy } from './bookCompanionCopy'
import { guideVisualCopy } from './guideVisualCopy'
import { PassageEvidence } from './PassageEvidence'
import { GuideGraph } from './GuideGraph'
import { GuideTimeline } from './GuideTimeline'
import './bookCompanion.css'
import './guideVisuals.css'
export { PassageEvidence } from './PassageEvidence'
const GuideMap = lazy(() => import('./GuideMap'))

function Connections({ nodes, edges, ui, onRead, kind, guideKey }: { nodes: GuideEntity[]; edges: GuideConnection[]; ui: UILanguage; onRead: (paragraph: number, citation?: BookCitation) => void; kind: 'people' | 'places'; guideKey: string }) {
  const [focused, setFocused] = useState(() => {
    try { const saved = sessionStorage.getItem(`bunko-guide-focus:${guideKey}:${kind}`); if (saved === '' || nodes.some(n => n.id === saved)) return saved || '' } catch { /* Optional selection. */ }
    if (kind !== 'people' || nodes.length <= 8) return ''
    return [...nodes].sort((a, b) => edges.filter(e => e.from === b.id || e.to === b.id).length - edges.filter(e => e.from === a.id || e.to === a.id).length)[0]?.id || ''
  }), [edgeIndex, setEdgeIndex] = useState<number | null>(null)
  const [geographic, setGeographic] = useState(kind === 'places'), details = useRef<HTMLDivElement>(null)
  const t = bookCompanionCopy[ui], v = guideVisualCopy[ui]
  const selected = nodes.find(n => n.id === focused), edge = edgeIndex === null ? undefined : edges[edgeIndex]
  const shown = selected ? [selected] : nodes
  const select = (id: string) => { setFocused(id); setEdgeIndex(null); try { sessionStorage.setItem(`bunko-guide-focus:${guideKey}:${kind}`, id) } catch { /* Optional selection. */ } }
  const selectEdge = (i: number) => { setEdgeIndex(i); setTimeout(() => details.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }), 0) }
  return <>
    {kind === 'places' && <div className="guide-segmented guide-map-tabs">
      <button type="button" aria-pressed={geographic} onClick={() => setGeographic(true)}>{v.map}</button>
      <button type="button" aria-pressed={!geographic} onClick={() => setGeographic(false)}>{v.story}</button>
    </div>}
    {kind === 'places' && geographic ? <Suspense fallback={<p role="status">{t.generating}</p>}><GuideMap nodes={nodes} edges={edges} guideKey={guideKey} ui={ui} onSelect={select} onEdge={selectEdge} selectedEdge={edgeIndex} /></Suspense>
      : <GuideGraph nodes={nodes} edges={edges} guideKey={`${guideKey}:${kind}`} ui={ui} selected={focused} onSelect={select} onEdge={selectEdge} label={kind === 'places' ? t.schematic : t.people} />}
    <div ref={details} className="guide-details-panel">
      {edge && <article className="guide-connection selected" aria-live="polite"><h3><bdi>{nodes.find(n => n.id === edge.from)?.name}</bdi><span aria-hidden="true">{edge.direction === 'forward' ? '→' : '↔'}</span><bdi>{nodes.find(n => n.id === edge.to)?.name}</bdi></h3><p dir="auto">{edge.label}</p>{edge.certainty !== 'stated' && <span className="guide-uncertain">{edge.certainty === 'background' ? t.background : t.interpretation}</span>}<PassageEvidence citations={edge.citations} ui={ui} onRead={onRead} /></article>}
      <div className="guide-entity-grid">{shown.map(node => <article key={node.id} className="guide-card">
        <h2 dir="auto">{node.name}</h2>{!!node.aliases.length && <p className="guide-aliases" dir="auto">{node.aliases.join(' · ')}</p>}
        <p dir="auto">{node.detail}</p>{node.certainty !== 'stated' && <span className="guide-uncertain">{node.certainty === 'background' ? t.background : t.interpretation}</span>}
        <PassageEvidence citations={node.citations} ui={ui} onRead={onRead} />
      </article>)}</div>
      {edges.length > 0 && <details className="guide-connection-list" open={!!selected}><summary>{v.list} · {edges.filter(e => !selected || e.from === selected.id || e.to === selected.id).length} {v.connections}</summary>
        {edges.filter(e => !selected || e.from === selected.id || e.to === selected.id).map((item, i) => <article key={i} className="guide-connection">
          <h3><bdi>{nodes.find(n => n.id === item.from)?.name}</bdi><span aria-hidden="true">{item.direction === 'forward' ? '→' : '↔'}</span><bdi>{nodes.find(n => n.id === item.to)?.name}</bdi></h3>
          <p dir="auto">{item.label}</p>{item.certainty !== 'stated' && <span className="guide-uncertain">{item.certainty === 'background' ? t.background : t.interpretation}</span>}<PassageEvidence citations={item.citations} ui={ui} onRead={onRead} />
        </article>)}
      </details>}
    </div>
  </>
}

export function BookGuide({ guide, tab, ui, onRead }: { guide: BookResponse; tab: 'people' | 'places' | 'timeline'; ui: UILanguage; onRead: (paragraph: number, citation?: BookCitation) => void }) {
  const t = bookCompanionCopy[ui], v = guideVisualCopy[ui], entries = tab === 'timeline' ? guide.events : guide[tab]
  return <section className="book-guide">
    <p className="guide-coverage">{guide.coverage.scope === 'book' ? `${v.overview}${guide.coverage.chapters?.length ? ` · ${v.chapters} ${guide.coverage.chapters.map(c => c + 1).join(', ')}` : ''}` : `${t.coverage} ${guide.coverage.first + 1}–${guide.coverage.last + 1}`}{guide.coverage.partial ? ` · ${v.partial}` : ''}</p>
    {!entries?.length ? <p className="guide-empty">{t.empty}</p> : tab === 'timeline' ? <GuideTimeline key={guide.key} guideKey={guide.key} events={guide.events || []} ui={ui} onRead={onRead} />
      : <Connections key={`${guide.key}:${tab}`} nodes={guide[tab] || []} edges={(tab === 'people' ? guide.relationships : guide.routes) || []} kind={tab} guideKey={guide.key} ui={ui} onRead={onRead} />}
    {guide.knowledge && guide.knowledge !== 'passages' && <p className="guide-uncertain">{t.background}</p>}<p className="guide-caption">{t.ai}</p>
  </section>
}
