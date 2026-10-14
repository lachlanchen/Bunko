// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LanguageChoices } from './LanguageChoices'
afterEach(cleanup)
it('follows click order, promotes the next main, and appends a reselected language', () => {
  function Harness() { const [selected, set] = useState(['ja', 'en']); return <LanguageChoices available={['ja', 'en', 'zh']} selected={selected} ui="en" onChange={set} /> }
  render(<Harness />)
  fireEvent.click(screen.getByRole('button', { name: 'Japanese, 1' }))
  expect(screen.getByRole('button', { name: 'English, 1' }).className).toContain('main-language')
  fireEvent.click(screen.getByRole('button', { name: 'Chinese' }))
  fireEvent.click(screen.getByRole('button', { name: 'Japanese' }))
  expect(screen.getByRole('button', { name: 'Chinese, 2' }).className).toContain('translation-language')
  expect(screen.getByRole('button', { name: 'Japanese, 3' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'English, 1' }))
  expect(screen.getByRole('button', { name: 'Chinese, 1' }).className).toContain('main-language')
})
it('ignores stale book layers and keeps the last selected language', () => {
  function Harness() { const [selected, set] = useState(['fr', 'en']); return <LanguageChoices available={['ja', 'en']} selected={selected} ui="en" onChange={set} /> }
  render(<Harness />)
  fireEvent.click(screen.getByRole('button', { name: 'English, 1' }))
  expect(screen.getByRole('button', { name: 'English, 1' }).getAttribute('aria-disabled')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'Japanese' }))
  expect(screen.getByRole('button', { name: 'Japanese, 2' }).getAttribute('aria-pressed')).toBe('true')
})
