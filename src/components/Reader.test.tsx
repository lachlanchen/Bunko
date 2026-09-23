// @vitest-environment jsdom
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Reader } from './Reader'
import { copies } from '../i18n'
import { DEFAULT_SETTINGS } from '../lib/settings'
import type { BookMeta, Chapter } from '../types'

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
