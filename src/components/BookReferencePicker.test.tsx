// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { BookReferencePicker } from './BookReferencePicker'
import type { BookMeta } from '../types'
const fixture = vi.hoisted(() => ({
  meta: { schema: 1, id: 'garden', mode: 'interlinear', primary: 'en', langs: ['en'], title: { en: ['Garden'] }, titleText: { en: 'Garden' }, author: { name: 'Example author' }, bytes: 200, paras: 2, chapters: [{ n: 1, file: 'c0001.json', bytes: 200, paras: 2, title: { en: 'Arrival' } }] } satisfies BookMeta,
  chapter: { p: [{ u: [{ en: ['Ada arrives. Ben welcomes her.'] }] }, { u: [{ en: ['They walk together.'] }] }] },
}))
vi.mock('../lib/library', () => ({ loadIndex: async () => ({ books: [] }), loadMeta: async () => fixture.meta, loadChapter: async () => fixture.chapter }))
vi.mock('../lib/backNavigation', () => ({ useBackAction: () => {} }))
afterEach(cleanup)
it('selects an exact sentence with a stable chapter and paragraph locator', async () => {
  const choose = vi.fn()
  render(<BookReferencePicker meta={fixture.meta} initial={{ id: 'garden', chapter: 0, paragraph: 0, file: 'c0001.json', language: 'en', replyLanguage: 'en', scope: 'passage' }} ui="en" onClose={() => {}} onChoose={choose} />)
  await screen.findByText('Ada arrives. Ben welcomes her.')
  fireEvent.change(screen.getByLabelText('Reference'), { target: { value: 'sentence' } })
  expect(screen.getByRole('button', { name: 'Use reference' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Ben welcomes her.' }))
  fireEvent.click(screen.getByRole('button', { name: 'Use reference' }))
  expect(choose.mock.calls[0][0]).toEqual({ id: 'garden', chapter: 0, paragraph: 0, file: 'c0001.json', language: 'en', replyLanguage: 'en', scope: 'sentence', quote: 'Ben welcomes her.' })
})
it('paragraph and whole-book scopes are explicit and warn about later events', async () => {
  const choose = vi.fn()
  render(<BookReferencePicker meta={fixture.meta} initial={{ id: 'garden', chapter: 0, paragraph: 0, file: 'c0001.json', language: 'en', replyLanguage: 'en', scope: 'passage' }} ui="en" onClose={() => {}} onChoose={choose} />)
  await screen.findByText('Ada arrives. Ben welcomes her.')
  fireEvent.change(screen.getByLabelText('Reference'), { target: { value: 'paragraph' } })
  fireEvent.change(screen.getByLabelText('Paragraph'), { target: { value: '2' } })
  expect(screen.getByText('They walk together.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Use reference' }))
  expect(choose.mock.calls[0][0].paragraph).toBe(1)
  fireEvent.change(screen.getByLabelText('Reference'), { target: { value: 'book' } })
  expect(screen.getByText('Whole-book and chapter references can include later events.')).toBeInTheDocument()
})
