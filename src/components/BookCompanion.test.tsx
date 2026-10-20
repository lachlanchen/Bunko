// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BookCompanion } from './BookCompanion'
import { BookGuide } from './BookGuide'
import { companionReference, savedGuide, saveGuide, type BookCompanionContext, type BookResponse } from '../lib/bookCompanion'

const fixture = vi.hoisted(() => ({ user: { id: 1, login: 'reader' } as { id: number; login: string } | null, call: vi.fn(), listeners: new Set<() => void>() }))
vi.mock('../lib/discussions', () => ({ currentUser: () => fixture.user, subscribeSession: (fn: () => void) => { fixture.listeners.add(fn); return () => fixture.listeners.delete(fn) }, restoreSession: async () => {},
  signIn: vi.fn(), requestId: () => 'fixture-request-id', DiscussionError: class extends Error {} }))
vi.mock('../lib/documentAgent', () => ({ initialModelPolicy: { providers: ['DeepSeek'], consentKey: 'DeepSeek' }, agentCall: (...args: unknown[]) => fixture.call(...args) }))
vi.mock('../lib/backNavigation', () => ({ useBackAction: () => {} }))
vi.mock('./DocumentContent', () => ({ DocumentContent: ({ text }: { text: string }) => <p>{text}</p> }))
vi.mock('./DemoAccount', () => ({ DemoAccount: () => null, DemoNotice: () => null }))
vi.mock('./CloudPlans', () => ({ CloudPlans: ({ onBack }: { onBack: () => void }) => <button onClick={onBack}>Back to reading</button> }))
vi.mock('../lib/library', () => ({ loadIndex: async () => ({ books: [] }), loadMeta: async () => context.meta, loadChapter: async () => ({ p: [{ u: [{ en: ['Ada arrives.'] }] }, { u: [{ en: ['Ben welcomes her.'] }] }] }) }))
const context: BookCompanionContext = {
  meta: { schema: 1, id: 'garden', mode: 'single', primary: 'en', langs: ['en'], title: { en: ['The Garden'] }, titleText: { en: 'The Garden' }, author: {}, bytes: 100, paras: 3, chapters: [{ n: 1, file: 'c0001-aabb.json', bytes: 100, paras: 3, title: { en: 'Arrival' } }] },
  chapter: 0, paragraph: 1, language: 'en', returnTo: 'reader',
}
const reference = companionReference(context, 'en', 'passage')
const evidence = [{ passage: 'P1', paragraph: 0, quote: 'Ada met Ben in the garden.' }]
const guide: BookResponse = { key: 'guide-key', revision: 'aabb', reference, answer: 'Ada meets Ben.', citations: evidence, insufficient: false,
  coverage: { chapter: 0, first: 0, last: 1, total: 3, partial: false, scope: 'passage', language: 'en' },
  people: [{ id: 'ada', name: 'Ada', aliases: ['A'], detail: 'A visitor.', certainty: 'stated', citations: evidence },
    { id: 'ben', name: 'Ben', aliases: [], detail: 'Her friend.', certainty: 'interpretation', citations: evidence }],
  relationships: [{ from: 'ada', to: 'ben', label: 'Friends', certainty: 'interpretation', citations: evidence }],
  places: [{ id: 'garden', name: 'Garden', detail: 'Their meeting place.', aliases: [], certainty: 'stated', citations: evidence }], routes: [],
  events: [{ title: 'The meeting', when: '', detail: 'Ada meets Ben.', certainty: 'stated', citations: evidence }],
}
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); fixture.user = { id: 1, login: 'reader' }
  fixture.call.mockReset().mockImplementation(async (action: string) => action === 'messages' ? { messages: [], guide: null } : {})
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
const open = (onRead = vi.fn()) => render(<BookCompanion {...{ context, onRead }} ui="en" onBack={() => {}} onGeneral={() => {}} />)

it('loads the exact reading scope without a generation and preserves draft through plans', async () => {
  open()
  await waitFor(() => expect(fixture.call).toHaveBeenCalledWith('messages', { book: reference, checkGuide: true }))
  expect(fixture.call.mock.calls.some(c => c[0] === 'send')).toBe(false)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Who is Ada?' } })
  fireEvent.click(screen.getByLabelText('More'))
  fireEvent.click(screen.getByRole('button', { name: 'Reading plans' }))
  fireEvent.click(screen.getByRole('button', { name: 'Back to reading' }))
  expect(screen.getByRole('textbox')).toHaveValue('Who is Ada?')
  expect(screen.getByRole('textbox').closest('form')?.nextElementSibling).toBeNull()
  cleanup(); open()
  expect(screen.getByRole('textbox')).toHaveValue('Who is Ada?')
})
it('explicit guide request obtains consent once and shares one guide across three views', async () => {
  fixture.call.mockImplementation(async action => action === 'messages' ? { messages: [], guide: null } : { id: 'done', state: 'completed', kind: 'guide', question: 'Build reading guide', answer: guide.answer, papers: [], bookResponse: guide })
  const read = vi.fn(); open(read)
  await waitFor(() => expect(fixture.call).toHaveBeenCalled())
  fireEvent.click(screen.getByRole('button', { name: 'People' }))
  fireEvent.click(screen.getByRole('button', { name: 'Build reading guide' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Agree and continue' }))
  await screen.findByRole('heading', { name: 'Ada' })
  expect(savedGuide(reference)?.key).toBe(guide.key)
  fireEvent.click(screen.getAllByText(/Source passages/)[0])
  fireEvent.click(screen.getAllByRole('button', { name: /Read passage · P1/ })[0])
  expect(read).toHaveBeenCalledWith(0, reference, 'Ada met Ben in the garden.')
  fireEvent.click(screen.getByRole('button', { name: 'Places' }))
  expect(screen.getByRole('heading', { name: 'Garden' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Timeline' }))
  expect(screen.getByText('Time not stated')).toBeInTheDocument()
  expect(fixture.call.mock.calls.filter(c => c[0] === 'send')).toHaveLength(1)
})
it('offline public guide remains readable while private drafts are account-separated', async () => {
  saveGuide(reference, guide)
  fixture.call.mockRejectedValue(new Error('offline'))
  open()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My private thought' } })
  cleanup(); fixture.user = null; open()
  expect(screen.getByRole('textbox')).toHaveValue('')
  fireEvent.click(screen.getByRole('button', { name: 'People' }))
  expect(screen.getByRole('heading', { name: 'Ada' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Check for updates' })).toBeDisabled()
})
it('online revalidation removes a cached guide for an obsolete edition without generating', async () => {
  saveGuide(reference, guide); open()
  fireEvent.click(screen.getByRole('button', { name: 'People' }))
  await screen.findByRole('button', { name: 'Build reading guide' })
  expect(savedGuide(reference)).toBeNull()
  expect(fixture.call.mock.calls.some(c => c[0] === 'send')).toBe(false)
})
it('a slow initial history response cannot erase a question sent while it loads', async () => {
  let historyDone!: (value: unknown) => void, answerDone!: (value: unknown) => void
  fixture.call.mockImplementation(action => new Promise(resolve => { if (action === 'messages') historyDone = resolve; else answerDone = resolve }))
  localStorage.setItem('bunko-book-consent-v2:1:DeepSeek', 'yes')
  open(); await waitFor(() => expect(historyDone).toBeDefined())
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'A new question' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
  await act(async () => historyDone({ messages: [], guide: null }))
  expect(screen.getByText('A new question')).toBeInTheDocument()
  await act(async () => answerDone({ id: 'answered', state: 'completed', question: 'A new question', kind: 'answer', answer: 'The new answer.', papers: [], bookResponse: guide }))
  expect(screen.getByText('The new answer.')).toBeInTheDocument()
})
it('source passages render as text and never execute returned markup', () => {
  render(<BookGuide guide={{ ...guide, people: [{ ...guide.people![0], name: '<img src=x onerror=alert(1)>', citations: [{ ...evidence[0], quote: '<script>unsafe</script>' }] }] }} tab="people" ui="en" onRead={() => {}} />)
  expect(screen.getByRole('heading', { name: '<img src=x onerror=alert(1)>', level: 2 })).toBeInTheDocument()
  expect(document.querySelector('script')).toBeNull()
  expect(document.querySelector('img')).toBeNull()
})
it('@ selects a compact reference without replacing the chat and survives a source-reading detour', async () => {
  localStorage.setItem('bunko-book-consent-v2:1:DeepSeek', 'yes')
  const old = { id: 'old', state: 'completed', question: 'An earlier question', answer: 'Earlier answer', kind: 'answer', papers: [] }
  fixture.call.mockImplementation(async action => action === 'messages' ? { messages: [old], guide: null } : { ...old, id: 'new' })
  open()
  await screen.findByText('Earlier answer')
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Explain this for a@b.com @' } })
  await screen.findByText('Ben welcomes her.')
  fireEvent.change(screen.getByLabelText('Reference'), { target: { value: 'paragraph' } })
  fireEvent.click(screen.getByRole('button', { name: 'Use reference' }))
  expect(screen.getByRole('textbox')).toHaveValue('Explain this for a@b.com ')
  expect(screen.getByText('Earlier answer')).toBeInTheDocument()
  cleanup(); open()
  expect(screen.getByRole('textbox')).toHaveValue('Explain this for a@b.com ')
  await screen.findByText('Earlier answer')
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
  await waitFor(() => expect(fixture.call.mock.calls.some(c => c[0] === 'send')).toBe(true))
  const send = fixture.call.mock.calls.find(c => c[0] === 'send')![1]
  expect(send.book).toEqual(reference)
  expect(send.reference).toEqual({ ...reference, scope: 'paragraph' })
})
