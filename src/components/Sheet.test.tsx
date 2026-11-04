// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Sheet } from './Sheet'

afterEach(cleanup)

it('focuses an explicit close action and restores the opener when dismissed', () => {
  const opener = document.createElement('button'); document.body.append(opener); opener.focus()
  const close = vi.fn()
  const view = render(<Sheet title="Settings" closeLabel="Close" onClose={close}><input aria-label="Book title" /></Sheet>)
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }))
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(close).toHaveBeenCalledOnce()
  view.unmount(); expect(document.activeElement).toBe(opener); opener.remove()
})

it('dismisses on a backdrop tap but keeps drags starting inside the sheet open', () => {
  const close = vi.fn()
  render(<Sheet title="Settings" closeLabel="Close" onClose={close}><input aria-label="Book title" /></Sheet>)
  const backdrop = screen.getByRole('dialog')
  fireEvent.pointerDown(screen.getByLabelText('Book title')); fireEvent.click(backdrop)
  expect(close).not.toHaveBeenCalled()
  fireEvent.pointerDown(backdrop); fireEvent.click(backdrop)
  expect(close).toHaveBeenCalledOnce()
})
