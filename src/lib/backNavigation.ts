import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

const actions = new Map<symbol, { priority: number; run: () => void }>()

/** Sheets close before reader navigation, regardless of React effect order. */
export function useBackAction(run: () => void, enabled = true, priority = 0) {
  useEffect(() => {
    if (!enabled) return
    const key = Symbol()
    actions.set(key, { priority, run })
    return () => { actions.delete(key) }
  }, [run, enabled, priority])
}

export function goBack(): boolean {
  const action = [...actions.values()].sort((a, b) => b.priority - a.priority)[0]
  if (action && action.priority >= 20) { action.run(); return true }
  const selection = window.getSelection()
  if (selection && !selection.isCollapsed) { selection.removeAllRanges(); return true }
  if (!action) return false
  action.run()
  return true
}

export function installEdgeSwipe(target: Document, back: () => void): () => void {
  let start: { x: number; y: number; time: number; id: number; claimed: boolean } | null = null
  const cancel = () => { start = null }
  const selected = () => window.getSelection()?.isCollapsed === false
  const ownsHorizontalGesture = (element: Element | null) => {
    // Ordinary buttons/links/summary headings still support swiping. Mobile
    // browsers enlarge their hit regions into nearby whitespace; excluding
    // them would make whole rows mysteriously refuse a deliberate swipe.
    if (element?.closest('input, select, textarea, [contenteditable]:not([contenteditable="false"]), [role="slider"], .math-display, .library-chips, [data-no-swipe]')) return true
    for (let node = element; node && node !== target.body; node = node.parentElement) {
      if (node.scrollWidth > node.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(node).overflowX)) return true
    }
    return false
  }
  const begin = (event: TouchEvent) => {
    cancel()
    if (event.touches.length !== 1 || selected()) return
    const point = event.touches[0]
    const element = event.target instanceof Element ? event.target : null
    if (ownsHorizontalGesture(element)) return
    start = { x: point.clientX, y: point.clientY, time: event.timeStamp, id: point.identifier, claimed: false }
  }
  const move = (event: TouchEvent) => {
    // A coalesced move from the preceding gesture can arrive after a new start.
    if (!start || event.timeStamp < start.time) return
    // TouchList is array-like but is not iterable in every mobile WebView.
    const point = Array.from(event.touches).find((touch) => touch.identifier === start?.id)
    if (event.touches.length !== 1 || !point || selected()) { cancel(); return }
    const dx = point.clientX - start.x, dy = Math.abs(point.clientY - start.y)
    const elapsed = event.timeStamp - start.time
    if (dx < -8 || dy > 32 || (dy > 12 && dy > dx / 1.8) || elapsed > 550 || (!start.claimed && elapsed > 250)) { cancel(); return }
    if (dx >= 14 && dx > dy * 1.8) {
      start.claimed = true
      // Claim only a clearly horizontal gesture. Otherwise the native scroller
      // can cancel touch events before touchend, making swipe-back unreliable.
      if (event.cancelable) event.preventDefault()
    }
  }
  const end = (event: TouchEvent) => {
    if (start && event.timeStamp < start.time) return
    const from = start
    cancel()
    if (!from || !from.claimed || selected() || event.touches.length) return
    const point = Array.from(event.changedTouches).find((touch) => touch.identifier === from.id)
    const distance = from.x <= 28 ? 70 : 90
    if (point && event.timeStamp - from.time <= 550 && point.clientX - from.x >= distance && Math.abs(point.clientY - from.y) <= 32) back()
  }
  target.addEventListener('touchstart', begin, { passive: true })
  target.addEventListener('touchmove', move, { passive: false })
  target.addEventListener('touchend', end, { passive: true })
  target.addEventListener('touchcancel', cancel)
  return () => {
    target.removeEventListener('touchstart', begin)
    target.removeEventListener('touchmove', move)
    target.removeEventListener('touchend', end)
    target.removeEventListener('touchcancel', cancel)
  }
}

export function useBackNavigation() {
  useEffect(() => {
    const removeSwipe = installEdgeSwipe(document, goBack)
    const listener = Capacitor.getPlatform() === 'android'
      ? App.addListener('backButton', () => { if (!goBack()) void App.minimizeApp() }) : null
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape' && goBack()) event.preventDefault() }
    document.addEventListener('keydown', key)
    return () => {
      removeSwipe()
      document.removeEventListener('keydown', key)
      void listener?.then((handle) => handle.remove())
    }
  }, [])
}
