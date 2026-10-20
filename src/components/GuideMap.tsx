import { useState } from 'react'
import { geoMercator, geoPath, geoGraticule10, type GeoPermissibleObjects } from 'd3-geo'
import land from '../data/atlas-land.json'
import { atlas, findPlaces, suggestedPlace } from '../lib/guideAtlas'
import type { GuideConnection, GuideEntity } from '../lib/bookCompanion'
import type { UILanguage } from '../i18n'
import { GuideCanvas } from './GuideCanvas'
import { guideVisualCopy } from './guideVisualCopy'
import { labelLines } from '../lib/guideLayout'

export default function GuideMap({ nodes, edges, guideKey, ui, onSelect }: { nodes: GuideEntity[]; edges: GuideConnection[]; guideKey: string; ui: UILanguage; onSelect: (id: string) => void }) {
  const t = guideVisualCopy[ui], storageKey = `bunko-atlas-v1:${guideKey}`
  const [choices, setChoices] = useState<Record<string, string | null>>(() => {
    try { const value = JSON.parse(localStorage.getItem(storageKey) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {} } catch { return {} }
  })
  const [active, setActive] = useState(nodes[0]?.id || ''), [search, setSearch] = useState('')
  const pins = nodes.flatMap(node => {
    const chosen = Object.prototype.hasOwnProperty.call(choices, node.id)
    const place = chosen ? atlas.find(p => p.id === choices[node.id]) : suggestedPlace([node.name, ...node.aliases])
    return place ? [{ node, place, confirmed: chosen }] : []
  })
  // Center around the circular mean, so routes near the date line stay nearby.
  const signature = pins.map(p => `${p.place.id}:${p.node.id}`).join('|')
  const geometry = (() => {
    const locations = signature.split('|').filter(Boolean).map(s => atlas.find(p => p.id === s.split(':')[0])!).filter(Boolean)
    const centerLon = locations.length ? Math.atan2(locations.reduce((s, p) => s + Math.sin(p.longitude * Math.PI / 180), 0), locations.reduce((s, p) => s + Math.cos(p.longitude * Math.PI / 180), 0)) * 180 / Math.PI : 0
    const centerLat = locations.length ? locations.reduce((s, p) => s + p.latitude, 0) / locations.length : 12
    const projection = geoMercator().rotate([-centerLon, 0]).center([0, centerLat]).scale(100).translate([360, 230])
    if (locations.length) {
      const points = locations.map(p => projection([p.longitude, p.latitude])!)
      const dx = Math.max(...points.map(p => p[0])) - Math.min(...points.map(p => p[0])), dy = Math.max(...points.map(p => p[1])) - Math.min(...points.map(p => p[1]))
      projection.scale(Math.max(100, Math.min(1800, 100 * Math.min(500 / Math.max(20, dx), 270 / Math.max(20, dy)))))
    }
    return { projection, path: geoPath(projection) }
  })()
  const results = findPlaces(search || nodes.find(n => n.id === active)?.name || '')
  const save = (id: string | null) => {
    const next = { ...choices, [active]: id }; setChoices(next)
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('bunko-atlas-v1:'))
      for (const key of keys.slice(0, Math.max(0, keys.length - 19))) localStorage.removeItem(key)
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch { /* Offline map controls still work in memory. */ }
  }
  const selectedPin = pins.find(p => p.node.id === active)
  return <>
    <GuideCanvas key={signature} width={720} height={460} label={t.map} ui={ui} footer={<><p>{t.mapNote}</p><p>{t.naturalEarth}</p></>}>
      {scale => <>
      <rect x="-20000" y="-20000" width="40000" height="40000" className="atlas-ocean" />
      <path d={geometry.path(geoGraticule10()) || ''} className="atlas-grid" />
      <path d={geometry.path(land as GeoPermissibleObjects) || ''} className="atlas-land" />
      {edges.map((edge, i) => {
        const a = pins.find(p => p.node.id === edge.from), b = pins.find(p => p.node.id === edge.to)
        if (!a || !b) return null
        return <path key={i} d={geometry.path({ type: 'LineString', coordinates: [[a.place.longitude, a.place.latitude], [b.place.longitude, b.place.latitude]] }) || ''} className="atlas-route"><title>{edge.label}</title></path>
      })}
      {pins.map((pin, i) => {
        const point = geometry.projection([pin.place.longitude, pin.place.latitude])
        if (!point) return null
        const choose = () => { setActive(pin.node.id); setSearch(''); onSelect(pin.node.id) }
        return <g key={pin.node.id} transform={`translate(${point[0]},${point[1]}) scale(${1 / scale})`} className={`atlas-pin${pin.confirmed ? ' confirmed' : ''}${active === pin.node.id ? ' selected' : ''}`} role="button" tabIndex={0} aria-label={`${pin.node.name} · ${pin.place.name}, ${pin.place.country}`} onClick={choose} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose() } }}>
          <title>{pin.node.name} · {pin.place.name}, {pin.place.country}</title><circle r="15" /><text y="5" textAnchor="middle">{i + 1}</text>
          {active === pin.node.id && <text className="atlas-place-label" x={point[0] > 480 ? -21 : 21} y="-20" textAnchor={point[0] > 480 ? 'end' : 'start'}>{labelLines(pin.node.name, 20).map((line, i) => <tspan key={i} x={point[0] > 480 ? -21 : 21} dy={i ? 16 : 0}>{line}</tspan>)}</text>}
        </g>
      })}
      <g className="atlas-compass" transform="translate(680,40)"><path d="M0 -17L-6 6L0 2L6 6Z" /><text y="-24" textAnchor="middle">N</text></g>
      </>}
    </GuideCanvas>
    <p className="guide-caption">{t.candidates}</p>
    <div className="guide-name-index">{nodes.map(node => <button type="button" key={node.id} aria-pressed={active === node.id} onClick={() => { setActive(node.id); setSearch(''); onSelect(node.id) }}><bdi>{node.name}</bdi>{pins.some(p => p.node.id === node.id) ? ' ↗' : ''}</button>)}</div>
    {active && <details className="guide-locate" key={active} open={!selectedPin}>
      <summary>{t.locate} · <bdi>{nodes.find(n => n.id === active)?.name}</bdi></summary>
      {selectedPin && <p>{selectedPin.place.name} · {selectedPin.place.region} · {selectedPin.place.country}</p>}
      <input className="guide-search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchPlaces} aria-label={t.searchPlaces} />
      <div className="guide-location-results">{results.map(place => <button type="button" key={place.id} aria-label={`${t.confirm}: ${place.name}, ${place.country}`} onClick={() => save(place.id)}><strong>{place.name}</strong><span>{place.region} · {place.country}</span></button>)}</div>
      {!results.length && <p>{t.noLocation}</p>}
      {selectedPin && <button type="button" onClick={() => save(null)}>{t.remove}</button>}<p className="guide-caption">{t.localPins}</p>
    </details>}
  </>
}
