import { useCallback, useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react'
import { Maximize2, Minimize2, Minus, Plus, Scan } from 'lucide-react'
import type { UILanguage } from '../i18n'
import { useBackAction } from '../lib/backNavigation'
import { guideVisualCopy } from './guideVisualCopy'

/** A bounded local SVG viewport. Panning owns its gestures, never reader Back. */
export function GuideCanvas({ width, height, label, ui, children, footer }: {
  width: number; height: number; label: string; ui: UILanguage; children: ReactNode | ((scale: number) => ReactNode); footer?: ReactNode
}) {
  const t = guideVisualCopy[ui], svg = useRef<SVGSVGElement>(null)
  const [expanded, setExpanded] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 640, height: 420 })
  const fit = Math.min(size.width / width, size.height / height)
  const [view, setView] = useState({ x: width / 2, y: height / 2, zoom: 0 })
  const effectiveZoom = view.zoom || fit
  useEffect(() => {
    if (!svg.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width > 0 && entry.contentRect.height > 0) setSize({ width: entry.contentRect.width, height: entry.contentRect.height }) })
    observer.observe(svg.current); return () => observer.disconnect()
  }, [])
  const current = useRef(view), pointers = useRef(new Map<number, { x: number; y: number }>())
  const moved = useRef(false), start = useRef({ x: 0, y: 0 })
  useBackAction(() => setExpanded(false), expanded, 45)
  useEffect(() => {
    if (!expanded) return
    const priorFocus = document.activeElement, overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    container.current?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => { document.body.style.overflow = overflow; if (priorFocus instanceof HTMLElement && priorFocus.isConnected) priorFocus.focus() }
  }, [expanded])
  const update = useCallback((next: typeof view) => {
    const limit = Math.max(width, height) * 1.5
    next.x = Math.max(-limit, Math.min(limit, next.x)); next.y = Math.max(-limit, Math.min(limit, next.y))
    current.current = next; setView(next)
  }, [width, height])
  const zoom = useCallback((factor: number, clientX?: number, clientY?: number) => {
    const old = current.current, next = Math.max(fit * .6, Math.min(4, (old.zoom || fit) * factor))
    const rect = svg.current?.getBoundingClientRect()
    const dx = rect && clientX !== undefined ? clientX - rect.left - rect.width / 2 : 0
    const dy = rect && clientY !== undefined ? clientY - rect.top - rect.height / 2 : 0
    // Keep the place under the pointer stationary while zooming.
    update({ x: old.x + dx * (1 / (old.zoom || fit) - 1 / next), y: old.y + dy * (1 / (old.zoom || fit) - 1 / next), zoom: next })
  }, [fit, update])
  useEffect(() => {
    const element = svg.current
    if (!element) return
    const wheel = (event: WheelEvent) => {
      // Ordinary page scrolling remains available until the map is focused.
      if (!event.ctrlKey && !event.metaKey && document.activeElement !== element) return
      event.preventDefault()
      zoom(Math.exp(-Math.max(-120, Math.min(120, event.deltaY)) * .004), event.clientX, event.clientY)
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [zoom])
  const pointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 1) { moved.current = false; start.current = { x: e.clientX, y: e.clientY } }
    // Capture only an actual drag. Capturing a tap on the SVG root would
    // retarget its click away from the selected person, edge or map pin.
  }
  const pointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const previous = pointers.current.get(e.pointerId), matrix = svg.current?.getScreenCTM()
    if (!previous || !matrix) return
    const others = [...pointers.current].filter(([id]) => id !== e.pointerId)
    if (others.length) {
      const other = others[0][1], before = Math.hypot(previous.x - other.x, previous.y - other.y)
      const after = Math.hypot(e.clientX - other.x, e.clientY - other.y)
      if (before > 8 && after > 8) zoom(after / before, (e.clientX + other.x) / 2, (e.clientY + other.y) / 2)
      moved.current = true
    } else {
      if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 5) moved.current = true
      if (moved.current) update({ ...current.current, x: current.current.x - (e.clientX - previous.x) / matrix.a, y: current.current.y - (e.clientY - previous.y) / matrix.d })
    }
    if (moved.current) e.currentTarget.setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }
  return <div ref={container} className={`guide-canvas${expanded ? ' expanded' : ''}`} {...(expanded ? { role: 'dialog', 'aria-modal': true, 'aria-label': label } : {})}
    onKeyDown={e => {
      if (!expanded || e.key !== 'Tab') return
      const controls = [...(container.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]') || [])]
      if (!controls.length) return
      const first = controls[0], last = controls[controls.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }}>
    <div className="guide-canvas-tools">
      <span>{label}</span><div>
        <button type="button" aria-label={t.zoomOut} title={t.zoomOut} onClick={() => zoom(1 / 1.35)} disabled={effectiveZoom <= fit * .6}><Minus size={17} /></button>
        <button type="button" aria-label={t.zoomIn} title={t.zoomIn} onClick={() => zoom(1.35)} disabled={effectiveZoom >= 4}><Plus size={17} /></button>
        <button type="button" aria-label={t.fit} title={t.fit} onClick={() => update({ x: width / 2, y: height / 2, zoom: 0 })}><Scan size={17} /></button>
        <button type="button" aria-label={expanded ? t.close : t.expand} title={expanded ? t.close : t.expand} onClick={() => setExpanded(v => !v)}>{expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
      </div>
    </div>
    <svg ref={svg} tabIndex={0} viewBox={`${view.x - size.width / effectiveZoom / 2} ${view.y - size.height / effectiveZoom / 2} ${size.width / effectiveZoom} ${size.height / effectiveZoom}`} role="group" aria-label={label} data-no-swipe="true"
      onPointerDown={pointerDown} onPointerMove={pointerMove}
      onPointerUp={e => { pointers.current.delete(e.pointerId) }} onPointerCancel={e => { pointers.current.delete(e.pointerId); moved.current = true }}
      onClickCapture={e => { if (moved.current && e.detail) { e.preventDefault(); e.stopPropagation() } }}
      onClick={e => { if (expanded && e.target instanceof Element && e.target.closest('[role="button"]')) setExpanded(false) }}
      onKeyDown={e => {
        if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom(1.35) }
        if (e.key === '-') { e.preventDefault(); zoom(1 / 1.35) }
        if (e.target !== e.currentTarget) return
        const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]
        if (direction) { e.preventDefault(); update({ ...current.current, x: current.current.x + direction[0] * 64 / effectiveZoom, y: current.current.y + direction[1] * 64 / effectiveZoom }) }
        if (e.key === 'Home') { e.preventDefault(); update({ x: width / 2, y: height / 2, zoom: 0 }) }
      }}>
      <title>{label}</title>{typeof children === 'function' ? children(effectiveZoom) : children}
    </svg>
    <div className="guide-canvas-footer">{footer}<p>{t.drag}</p></div>
  </div>
}
