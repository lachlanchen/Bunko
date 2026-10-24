import { useId, useState } from 'react'
import { geoGraticule10, type GeoPermissibleObjects } from 'd3-geo'
import land from '../data/atlas-land.json'
import countries from '../data/atlas-countries.json'
import { atlas, historicalPlaces, readingPlaceChoices, suggestedReadingPlace } from '../lib/guideAtlas'
import { guideMapGeometry } from '../lib/guideMapGeometry'
import type { GuideConnection, GuideEntity } from '../lib/bookCompanion'
import type { UILanguage } from '../i18n'
import { GuideCanvas } from './GuideCanvas'
import { guideVisualCopy } from './guideVisualCopy'
import { labelLines } from '../lib/guideLayout'

export default function GuideMap({ nodes, edges, guideKey, ui, onSelect, onEdge, selectedEdge, bookId }: { bookId: string; nodes: GuideEntity[]; edges: GuideConnection[]; guideKey: string; ui: UILanguage; onSelect: (id: string) => void; onEdge: (index: number) => void; selectedEdge: number | null }) {
  const arrow = useId().replace(/:/g, ''), t = guideVisualCopy[ui], storageKey = `bunko-atlas-v1:${guideKey}`
  const [choices, setChoices] = useState<Record<string, string | null>>(() => {
    try { const value = JSON.parse(localStorage.getItem(storageKey) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {} } catch { return {} }
  })
  const [active, setActive] = useState(nodes[0]?.id || ''), [search, setSearch] = useState('')
  const pins = nodes.flatMap(node => {
    const chosen = Object.prototype.hasOwnProperty.call(choices, node.id)
    const place = chosen ? [...atlas, ...historicalPlaces(bookId)].find(p => p.id === choices[node.id]) : suggestedReadingPlace([node.name, ...node.aliases], bookId)
    return place ? [{ node, place, confirmed: chosen }] : []
  })
  const signature = JSON.stringify(pins.map(p => [p.node.id, p.place.id, p.place.longitude, p.place.latitude]))
  const geometry = guideMapGeometry(pins.map(p => p.place))
  const results = readingPlaceChoices(search || nodes.find(n => n.id === active)?.name || '', bookId)
  const mappedRoutes = edges.filter(edge => pins.some(p => p.node.id === edge.from) && pins.some(p => p.node.id === edge.to)).length
  const missing = nodes.filter(node => !pins.some(p => p.node.id === node.id))
  const save = (id: string | null | undefined) => {
    const next = { ...choices }
    if (id === undefined) delete next[active]
    else next[active] = id
    setChoices(next)
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('bunko-atlas-v1:'))
      for (const key of keys.slice(0, Math.max(0, keys.length - 19))) localStorage.removeItem(key)
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch { /* Offline map controls still work in memory. */ }
  }
  const selectedPin = pins.find(p => p.node.id === active)
  return <>
    <div className="atlas-coverage" role="status"><strong>{t.mappedPlaces}: {pins.length}/{nodes.length}</strong><span>{t.mappedRoutes}: {mappedRoutes}/{edges.length}</span></div>
    {!!missing.length && <p className="atlas-unresolved">{t.unmapped}: {missing.map(p => p.name).join(' · ')}</p>}
    {pins.length > 0 ? <GuideCanvas key={signature} stateKey={`${guideKey}:map-v2:${signature}`} width={720} height={460} label={t.map} ui={ui} footer={<><p>{t.mapNote}</p><p>{t.naturalEarth}</p></>}>
      {scale => <>
      <defs><marker id={arrow} viewBox="0 0 10 10" refX="28" refY="5" markerUnits="userSpaceOnUse" markerWidth={10 / scale} markerHeight={10 / scale} orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" className="atlas-arrow" /></marker></defs>
      <rect x="-20000" y="-20000" width="40000" height="40000" className="atlas-ocean" />
      <path d={geometry.path(geoGraticule10()) || ''} className="atlas-grid" />
      <path d={geometry.path(land as GeoPermissibleObjects) || ''} className="atlas-land" />
      <path d={geometry.path(countries as GeoPermissibleObjects) || ''} className="atlas-borders" />
      {countries.features.map((country, i) => {
        const p = country.properties, point = geometry.projection([p.LABEL_X, p.LABEL_Y])
        if (!point || point[0] < 40 || point[0] > 680 || point[1] < 35 || point[1] > 425) return null
        const label = ui === 'ja' ? p.NAME_JA : ui.startsWith('zh') ? p.NAME_ZH : p.NAME_EN
        const close = pins.some(pin => { const q = geometry.projection([pin.place.longitude, pin.place.latitude])!; return Math.abs(q[0] - point[0]) * scale < 55 && Math.abs(q[1] - point[1]) * scale < 30 })
        return <text key={i} transform={`translate(${point[0]},${point[1]}) scale(${1 / scale})`} y={close ? 34 : 0} className="atlas-country" textAnchor="middle">{label}</text>
      })}
      {edges.map((edge, i) => {
        const a = pins.find(p => p.node.id === edge.from), b = pins.find(p => p.node.id === edge.to)
        if (!a || !b) return null
        const d = geometry.path({ type: 'LineString', coordinates: [[a.place.longitude, a.place.latitude], [b.place.longitude, b.place.latitude]] }) || ''
        const label = `${a.node.name} → ${b.node.name}: ${edge.label}`
        return <g key={i} className={`atlas-route-control${selectedEdge === i ? ' selected' : ''}`} role="button" tabIndex={0} aria-label={label} onClick={() => onEdge(i)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdge(i) } }}>
          <title>{label}</title><path d={d} className="atlas-route-hit" /><path d={d} markerEnd={edge.direction === 'forward' ? `url(#${arrow})` : undefined} className={`atlas-route${edge.certainty !== 'stated' ? ' uncertain' : ''}`} />
        </g>
      })}
      {pins.map((pin, i) => {
        const point = geometry.projection([pin.place.longitude, pin.place.latitude])
        if (!point) return null
        const choose = () => { setActive(pin.node.id); setSearch(''); onSelect(pin.node.id) }
        return <g key={pin.node.id} transform={`translate(${point[0]},${point[1]}) scale(${1 / scale})`} className={`atlas-pin${pin.place.approximate ? ' approximate' : ''}${pin.confirmed ? ' confirmed' : ''}${active === pin.node.id ? ' selected' : ''}`} role="button" tabIndex={0} aria-label={`${pin.node.name} · ${pin.place.name}, ${pin.place.country}`} onClick={choose} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose() } }}>
          <title>{pin.node.name} · {pin.place.name}, {pin.place.country}</title><circle r="15" /><text y="5" textAnchor="middle">{i + 1}</text>
          {(active === pin.node.id || pins.length <= 6) && <text className="atlas-place-label" x={point[0] > 480 ? -21 : 21} y="-20" textAnchor={point[0] > 480 ? 'end' : 'start'}>{labelLines(pin.node.name, 20).map((line, i) => <tspan key={i} x={point[0] > 480 ? -21 : 21} dy={i ? 16 : 0}>{line}</tspan>)}</text>}
        </g>
      })}
      <g className="atlas-compass" transform="translate(680,40)"><path d="M0 -17L-6 6L0 2L6 6Z" /><text y="-24" textAnchor="middle">N</text></g>
      </>}
    </GuideCanvas> : <p className="guide-empty atlas-empty">{t.noMappedPlaces}</p>}
    <p className="guide-caption">{t.candidates}</p>
    <div className="guide-name-index">{nodes.map(node => <button type="button" key={node.id} aria-pressed={active === node.id} onClick={() => { setActive(node.id); setSearch(''); onSelect(node.id) }}>{pins.some(p => p.node.id === node.id) && <span className="atlas-index-number">{pins.findIndex(p => p.node.id === node.id) + 1}</span>}<bdi>{node.name}</bdi></button>)}</div>
    {active && <details className="guide-locate" key={active} open={!selectedPin}>
      <summary>{t.locate} · <bdi>{nodes.find(n => n.id === active)?.name}</bdi></summary>
      {selectedPin && <><p>{selectedPin.place.name} · {selectedPin.place.region} · {selectedPin.place.country}</p>
        {selectedPin.place.approximate && <p className="guide-caption">{t.historicalApproximation}</p>}
        {!!selectedPin.place.sources?.length && <div className="atlas-sources">{selectedPin.place.sources.map((url, i) => <a key={url} href={url} target="_blank" rel="noreferrer">{t.locationSource} {i + 1}</a>)}</div>}</>}
      <input className="guide-search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchPlaces} aria-label={t.searchPlaces} />
      <div className="guide-location-results">{results.map(place => <button type="button" key={place.id} aria-label={`${t.confirm}: ${place.name}, ${place.country}`} onClick={() => save(place.id)}><strong>{place.name}</strong><span>{place.region} · {place.country}</span></button>)}</div>
      {!results.length && <p>{t.noLocation}</p>}
      {selectedPin && <button type="button" onClick={() => save(null)}>{t.remove}</button>}
      {Object.prototype.hasOwnProperty.call(choices, active) && <button type="button" onClick={() => save(undefined)}>{t.resetLocation}</button>}<p className="guide-caption">{t.localPins}</p>
    </details>}
  </>
}
