import { useEffect, useRef, useState } from 'react'
import { quotedCalendar } from '../../shared/guide-calendar.mjs'
import type { GuideEvent, BookCitation } from '../lib/bookCompanion'
import type { UILanguage } from '../i18n'
import { PassageEvidence } from './PassageEvidence'
import { bookCompanionCopy } from './bookCompanionCopy'
import { guideVisualCopy } from './guideVisualCopy'

export function GuideTimeline({ events, ui, onRead }: { events: GuideEvent[]; ui: UILanguage; onRead: (paragraph: number, citation?: BookCitation) => void }) {
  const t = guideVisualCopy[ui], copy = bookCompanionCopy[ui]
  const indexed = events.map((event, index) => ({ event, index, date: quotedCalendar(event) }))
  const dated = indexed.filter(row => row.date).sort((a, b) => a.date!.start - b.date!.start || a.index - b.index)
  const undated = indexed.filter(row => !row.date)
  const [order, setOrder] = useState<'date' | 'text'>(dated.length > 1 ? 'date' : 'text'), [focused, setFocused] = useState<number | null>(null)
  const chronological = order === 'date' && dated.length > 0
  const chart = useRef<HTMLDivElement>(null), [chartWidth, setChartWidth] = useState(600)
  useEffect(() => {
    if (!chart.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width > 0) setChartWidth(entry.contentRect.width) })
    observer.observe(chart.current); return () => observer.disconnect()
  }, [chronological])
  const from = Math.min(...dated.map(row => row.date!.start)), to = Math.max(...dated.map(row => row.date!.end))
  const span = Math.max(to - from, 1 / 365)
  const position = (n: number) => 30 + (n - from) / span * (chartWidth - 60)
  const lanes: number[] = []
  const markers = dated.map(row => {
    const x = position(row.date!.start), end = position(row.date!.end)
    let lane = lanes.findIndex(last => last + 32 < x)
    if (lane < 0) lane = lanes.length
    lanes[lane] = Math.max(x, end)
    return { ...row, x, end, y: 80 + lane * 34 }
  })
  const tickValues = [...new Set([0, 1, 2, 3].map(i => from + i * span / 3))]
  const tickLabel = (value: number) => {
    const year = Math.floor(value), label = year <= 0 ? `${1 - year} BCE` : String(year)
    if (span >= 2 || year <= 0) return label
    const month = Math.min(11, Math.floor((value - year) * 12 + 1e-8))
    const date = new Date(0); date.setUTCFullYear(year, month, 1)
    return new Intl.DateTimeFormat(ui, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)
  }
  const choose = (index: number) => { setFocused(index); document.getElementById(`guide-event-${index}`)?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }) }
  const cards = (rows: typeof indexed, calendar: boolean) => <ol className={`guide-timeline${calendar ? ' calendar' : ''}`}>
    {rows.map(({ event, index }) => <li key={index} id={`guide-event-${index}`} className={focused === index ? 'selected' : ''}>
      <span className="guide-event-number">{index + 1}</span><span className="guide-time" dir="auto">{event.when || copy.undated}</span>
      <article className="guide-card"><h2 dir="auto">{event.title}</h2><p dir="auto">{event.detail}</p>
        {event.certainty !== 'stated' && <span className="guide-uncertain">{event.certainty === 'background' ? copy.background : copy.interpretation}</span>}
        <PassageEvidence citations={event.citations} ui={ui} onRead={onRead} />
      </article>
    </li>)}
  </ol>
  return <>
    <div className="guide-visual-toolbar"><div className="guide-segmented">
      <button type="button" aria-pressed={order === 'text'} onClick={() => setOrder('text')}>{t.narrative}</button>
      <button type="button" disabled={!dated.length} aria-pressed={chronological} onClick={() => setOrder('date')}>{t.chronological}</button>
    </div><span>{dated.length} / {events.length} {t.dates}</span></div>
    {chronological && <div className="guide-time-overview">
      <div className="guide-time-chart" ref={chart}><svg viewBox={`0 0 ${chartWidth} ${104 + Math.max(0, lanes.length - 1) * 34}`} role="group" aria-label={t.summary}>
        <title>{t.chronological}</title><line className="time-axis" x1="30" x2={chartWidth - 30} y1="45" y2="45" />
        {tickValues.filter((v, i) => !i || tickLabel(v) !== tickLabel(tickValues[i - 1])).map(value => {
          const label = tickLabel(value), x = position(value)
          return <g key={value}><line className="time-tick" x1={x} x2={x} y1="39" y2="52" /><text x={x} y="25" textAnchor={x < 50 ? 'start' : x > chartWidth - 50 ? 'end' : 'middle'}>{label}</text></g>
        })}
        {markers.map(({ event, index, x, y, end }) => {
          return <g key={index} className={`time-marker${focused === index ? ' selected' : ''}`} role="button" tabIndex={0} aria-label={`${event.when}: ${event.title}`} onClick={() => choose(index)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(index) } }}>
            <title>{event.when} · {event.title}</title><line x1={x} x2={x} y1="45" y2={y} className="time-stem" />
            {end > x && <line x1={x} x2={end} y1={y} y2={y} className="time-range" />}
            <circle cx={x} cy={y} r="13" /><text x={x} y={y + 4} textAnchor="middle">{index + 1}</text>
          </g>
        })}
      </svg></div><p>{t.dateNote}</p>
    </div>}
    {cards(chronological ? dated : indexed, chronological)}
    {chronological && undated.length > 0 && <><h3 className="guide-undated-title">{t.unknown}</h3><p className="guide-caption">{copy.textOrder}</p>{cards(undated, false)}</>}
  </>
}
