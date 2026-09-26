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
  let start: { x: number; y: number; time: number; id: number } | null = null
  const cancel = () => { start = null }
  const begin = (event: TouchEvent) => {
    cancel()
    if (event.touches.length !== 1 || !window.getSelection()?.isCollapsed) return
    const point = event.touches[0]
    const element = event.target instanceof Element ? event.target : null
    if (point.clientX > 28 || element?.closest('button, a, input, select, textarea, [contenteditable="true"], .math-display, .library-chips')) return
    start = { x: point.clientX, y: point.clientY, time: event.timeStamp, id: point.identifier }
  }
  const move = (event: TouchEvent) => {
    // A coalesced move from the preceding gesture can arrive after a new start.
    if (!start || event.timeStamp < start.time) return
    const point = [...event.touches].find((touch) => touch.identifier === start?.id)
    if (event.touches.length !== 1 || !point || Math.abs(point.clientY - start.y) > 24 || point.clientX < start.x - 8 || event.timeStamp - start.time > 450) cancel()
  }
  const end = (event: TouchEvent) => {
    if (start && event.timeStamp < start.time) return
    const from = start
    cancel()
    if (!from || !window.getSelection()?.isCollapsed) return
    const point = [...event.changedTouches].find((touch) => touch.identifier === from.id)
    if (point && event.timeStamp - from.time < 450 && point.clientX - from.x >= 70 && Math.abs(point.clientY - from.y) <= 24) back()
  }
  target.addEventListener('touchstart', begin, { passive: true })
  target.addEventListener('touchmove', move, { passive: true })
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
