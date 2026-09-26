// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { goBack, installEdgeSwipe, useBackAction } from './backNavigation'

afterEach(() => { cleanup(); window.getSelection()?.removeAllRanges() })
function Action({ priority, run }: { priority: number; run: () => void }) { useBackAction(run, true, priority); return null }

it('closes the top sheet before leaving the reader, then clears text selection', () => {
  const reader = vi.fn(), sheet = vi.fn()
  const view = render(<><Action key="reader" priority={0} run={reader} /><Action key="sheet" priority={40} run={sheet} /><p key="text">Selected text</p></>)
  const range = document.createRange(); range.selectNodeContents(document.querySelector('p')!)
  window.getSelection()?.addRange(range)
  goBack(); expect(sheet).toHaveBeenCalledOnce(); expect(reader).not.toHaveBeenCalled()
  view.rerender(<><Action key="reader" priority={0} run={reader} /><p key="text">Selected text</p></>)
  goBack(); expect(window.getSelection()?.isCollapsed).toBe(true)
  goBack(); expect(reader).toHaveBeenCalledOnce()
})

it('accepts only a quick rightward edge swipe and preserves scrolling, selection, sliders and multi-touch', () => {
  const back = vi.fn(), remove = installEdgeSwipe(document, back)
  const host = document.createElement('div'); document.body.append(host)
  const touch = (type: string, x: number, y: number, time: number, target: Element = host, count = 1) => {
    const event = new Event(type, { bubbles: true })
    Object.defineProperties(event, {
      touches: { value: type === 'touchend' ? [] : Array.from({ length: count }, (_, identifier) => ({ clientX: x, clientY: y, identifier })) },
      changedTouches: { value: [{ clientX: x, clientY: y, identifier: 0 }] },
      timeStamp: { value: time },
    })
    target.dispatchEvent(event)
  }
  touch('touchstart', 10, 100, 1000); touch('touchmove', 90, 103, 1090)
  touch('touchmove', 150, 350, 900) // delayed event from the previous gesture
  touch('touchend', 130, 105, 1180)
  expect(back).toHaveBeenCalledOnce()
  touch('touchstart', 100, 100, 0); touch('touchend', 230, 100, 180) // body selection drag
  touch('touchstart', 10, 100, 0); touch('touchmove', 30, 145, 90); touch('touchend', 140, 110, 180) // scroll, even returning to start
  touch('touchstart', 10, 100, 0); touch('touchend', 140, 100, 600) // long press
  touch('touchstart', 10, 100, 0, host, 2); touch('touchend', 140, 100, 180)
  const slider = document.createElement('input'); slider.type = 'range'; host.append(slider)
  touch('touchstart', 10, 100, 0, slider); touch('touchend', 140, 100, 180, slider)
  host.append('Selected text'); const range = document.createRange(); range.selectNodeContents(host)
  window.getSelection()?.addRange(range)
  touch('touchstart', 10, 100, 0); touch('touchend', 140, 100, 180)
  expect(back).toHaveBeenCalledOnce()
  remove(); host.remove()
})
