// @vitest-environment jsdom
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Reader } from './Reader'
import { copies } from '../i18n'
import { DEFAULT_SETTINGS } from '../lib/settings'
import type { BookMeta, Chapter, LangCode } from '../types'

const chapter: Chapter = { id: 'sample', n: 1, title: { ja: ['第一章'] }, p: [{ id: 'p1', src: 'ja', u: [{ src: 'ja', ja: ['日本語の原文'], en: ['English translation'] }] }] }
vi.mock('../lib/library', () => ({ loadChapter: vi.fn(async () => chapter) }))
beforeAll(() => { HTMLElement.prototype.scrollTo = vi.fn() })
afterEach(cleanup)
const meta: BookMeta = { schema: 1, id: 'sample', mode: 'trilingual_standard', primary: 'ja', langs: ['ja', 'en'], title: {}, titleText: { ja: '作品' }, author: {}, chapters: [{ n: 1, file: 'c001.json', bytes: 1, paras: 1, title: { ja: '第一章' } }], bytes: 1, paras: 1 }
it('shows only the original in source mode and restores selected translations in interlinear mode', async () => {
  const props = { meta, chapterIndex: 0, settings: { ...DEFAULT_SETTINGS, langs: ['en', 'ja'] as const }, copy: copies.en, ui: 'en' as const, onChapter: vi.fn(), onPlace: vi.fn(), startParagraph: 0, onOpenChapters: vi.fn(), onOpenSettings: vi.fn(), onBack: vi.fn(), backLabel: 'Back' }
  const view = render(<Reader {...props} settings={{ ...props.settings, langs: ['en', 'ja'], layout: 'source' }} />)
  await screen.findByText('日本語の原文')
  expect(screen.queryByText('English translation')).toBeNull()
  view.rerender(<Reader {...props} settings={{ ...props.settings, langs: ['en', 'ja'], layout: 'interlinear' }} />)
  expect(screen.getByText('English translation')).toBeTruthy()
})

it('opens a passage discussion and shows strong language labels', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ items: [] }) })))
  const props = { meta, chapterIndex: 0, settings: { ...DEFAULT_SETTINGS, langs: ['ja', 'en'] as LangCode[], layout: 'interlinear' as const }, copy: copies.en, ui: 'en' as const, onChapter: vi.fn(), onPlace: vi.fn(), startParagraph: 0, onOpenChapters: vi.fn(), onOpenSettings: vi.fn(), onBack: vi.fn(), backLabel: 'Back' }
  const { container } = render(<Reader {...props} />)
  await screen.findByText('日本語の原文')
  expect([...container.querySelectorAll('.language-label')].map((item) => item.textContent)).toEqual(['Japanese', 'English'])
  fireEvent.click(screen.getByRole('button', { name: 'Discuss passage' }))
  expect(screen.getByRole('dialog')).toBeTruthy()
  expect(screen.getByText('日本語の原文', { selector: 'blockquote' })).toBeTruthy()
  vi.unstubAllGlobals()
})
