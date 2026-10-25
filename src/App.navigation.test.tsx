// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type { Reader } from './components/Reader'
import type { BookCompanion } from './components/BookCompanion'
import App from './App'

const fixture = vi.hoisted(() => ({
  save: vi.fn(),
  meta: { schema: 1, id: 'garden', mode: 'interlinear', primary: 'en', langs: ['en', 'ja'], title: { en: ['Garden'] }, titleText: { en: 'Garden' }, author: { name: 'Example author' }, bytes: 200, paras: 20, chapters: [{ n: 1, file: 'c0001.json', bytes: 200, paras: 20, title: { en: 'Arrival' } }] },
}))
vi.mock('./lib/activityRewards', () => ({ observeForegroundUse: () => {} }))
vi.mock('./lib/backNavigation', () => ({ useBackAction: () => {}, useBackNavigation: () => {} }))
vi.mock('./lib/updateService', () => ({ useUpdates: () => ({ check: () => {} }) }))
vi.mock('./lib/discussions', () => ({ currentUser: () => ({ id: 1 }) }))
vi.mock('./lib/settings', async importOriginal => {
  const original = await importOriginal<typeof import('./lib/settings')>()
  return { ...original, loadUI: async () => ({ language: 'en' }), loadSettings: async () => ({ ...original.DEFAULT_SETTINGS, langs: ['en'] }), loadPlaces: async () => ({ garden: { chapter: 0, paragraph: 7 } }), savePlace: fixture.save, saveSettings: vi.fn() }
})
vi.mock('./lib/library', () => ({
  loadIndex: async () => ({ books: [{ ...fixture.meta, title: { en: 'Garden' }, author: 'Example author', chapters: 1 }] }),
  loadMeta: async () => fixture.meta, downloadedChapterCount: async () => 0,
  subscribeIndex: () => () => {}, cachedBookCounts: async () => ({}), storageEstimate: async () => null,
}))
vi.mock('./components/UpdatePrompt', () => ({ UpdatePrompt: () => null, UpdateSettings: () => null }))
vi.mock('./components/SharedAccount', () => ({ SharedAccount: () => null }))
vi.mock('./components/ReadingShare', () => ({ ReadingShare: () => null }))
vi.mock('./components/CloudPlans', () => ({ CloudPlans: () => null }))
vi.mock('./components/DocumentAgent', () => ({ DocumentAgent: () => null }))
vi.mock('./components/Reader', () => ({ Reader: (p: ComponentProps<typeof Reader>) => <section>
  <output aria-label="Reader position">{p.startParagraph}</output>
  <output aria-label="Main language">{p.settings.langs[0]}</output>
  <button onClick={() => p.onCompanion?.(p.startParagraph, 'en')}>Ask from bookmark</button>
  <button onClick={() => p.onPlace(15)}>Scroll source</button>
  <button onClick={p.onBack}>Back from source</button>
</section> }))
vi.mock('./components/BookCompanion', () => ({ BookCompanion: (p: ComponentProps<typeof BookCompanion>) => <section>
  <button onClick={() => p.onRead(2, { id: 'garden', chapter: 0, paragraph: 2, file: 'c0001.json', language: 'ja', replyLanguage: 'en', scope: 'paragraph' })}>Open source</button>
  <button onClick={p.onBack}>Return to original reading</button>
</section> }))
afterEach(() => { cleanup(); fixture.save.mockClear(); window.history.replaceState({}, '', '/') })

it('source detours keep the saved bookmark and temporarily show the citation language', async () => {
  window.history.replaceState({}, '', '/?book=garden')
  render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: /continue/i }))
  expect(screen.getByLabelText('Reader position')).toHaveTextContent('7')
  fireEvent.click(screen.getByText('Ask from bookmark'))
  fixture.save.mockClear()
  fireEvent.click(screen.getByText('Open source'))
  expect(await screen.findByLabelText('Reader position')).toHaveTextContent('2')
  expect(screen.getByLabelText('Main language')).toHaveTextContent('ja')
  fireEvent.click(screen.getByText('Scroll source'))
  expect(fixture.save).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('Back from source'))
  fireEvent.click(screen.getByText('Return to original reading'))
  expect(screen.getByLabelText('Reader position')).toHaveTextContent('7')
  expect(screen.getByLabelText('Main language')).toHaveTextContent('en')
  expect(fixture.save).not.toHaveBeenCalled()
})

it('the book companion stays reachable and returns to the saved passage without a region gate', async () => {
  window.history.replaceState({}, '', '/?book=garden')
  render(<App />)
  const continueReading = await screen.findByRole('button', { name: /continue/i })
  expect(screen.getByRole('button', { name: 'Reading companion' })).toBeInTheDocument()
  fireEvent.click(continueReading)
  expect(screen.getByLabelText('Reader position')).toHaveTextContent('7')
  fireEvent.click(screen.getByText('Ask from bookmark'))
  expect(screen.getByText('Open source')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Return to original reading'))
  expect(screen.getByLabelText('Reader position')).toHaveTextContent('7')
})
