// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { BookCompanion } from './BookCompanion'
import { BookGuide } from './BookGuide'
import { companionReference, savedGuide, saveGuide, type BookCompanionContext, type BookResponse } from '../lib/bookCompanion'

const fixture = vi.hoisted(() => ({ user: { id: 1, login: 'reader' } as { id: number; login: string } | null, call: vi.fn(), listeners: new Set<() => void>() }))
vi.mock('../lib/discussions', () => ({ currentUser: () => fixture.user, subscribeSession: (fn: () => void) => { fixture.listeners.add(fn); return () => fixture.listeners.delete(fn) }, restoreSession: async () => {},
  api: async () => ({providers:['github']}), signInMethods: async () => ['github'], signIn: vi.fn(), requestId: () => 'fixture-request-id', DiscussionError: class extends Error {} }))
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
it('a cache miss at a new passage preserves saved artifacts without generating', async () => {
  saveGuide(reference, guide); open()
  fireEvent.click(screen.getByRole('button', { name: 'People' }))
  await screen.findByRole('heading', { name: 'Ada' })
  expect(savedGuide(reference)?.key).toBe(guide.key)
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

it('reopening at another passage retains book drafts and saved artifacts with exact source navigation', async () => {
  saveGuide(reference, guide)
  const read = vi.fn(), props = { ui: 'en' as const, onRead: read, onBack() {}, onGeneral() {} }
  const view = render(<BookCompanion context={context} {...props} />)
  await waitFor(() => expect(fixture.call).toHaveBeenCalled())
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Keep my book question' } })
  view.rerender(<BookCompanion context={{ ...context, paragraph: 2 }} {...props} />)
  expect(screen.getByRole('textbox')).toHaveValue('Keep my book question')
  fireEvent.click(screen.getByRole('button', { name: 'People' }))
  expect(screen.getByRole('heading', { name: 'Ada' })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Saved results' })).toHaveValue(guide.key)
})
it('opening an older guide in chat selects that artifact rather than the latest one', async () => {
  const older = { ...guide, key: 'older', people: [{ ...guide.people![0], name: 'Earlier Ada', level: 2 }] }
  const newer = { ...guide, key: 'newer', people: [{ ...guide.people![0], name: 'Later Ada' }] }
  fixture.call.mockResolvedValue({ messages: [older, newer].map((g, i) => ({ id: String(i), state: 'completed', kind: 'guide', question: `Guide ${i}`, answer: g.answer, papers: [], bookResponse: g })), guide: newer })
  open(); await screen.findByText('Guide 1')
  fireEvent.change(screen.getByRole('combobox', { name: 'Conversations' }), { target: { value: 'older' } })
  fireEvent.click(within(screen.getByText('Guide 0').closest('article')!).getByRole('button', { name: 'People' }))
  expect(screen.getByRole('heading', { name: 'Earlier Ada', level: 2 })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Saved results' })).toHaveValue('older')
})

it('a failed response appears once in chat, including after switching views', async () => {
  const error = 'The reading answer could not be completed. Please retry.'
  localStorage.setItem('bunko-book-consent-v2:1:DeepSeek', 'yes')
  fixture.call.mockImplementation(async action => action === 'messages' ? { messages: [], guide: null } : { id: 'failed', state: 'failed', kind: 'answer', question: 'Relationships', answer: '', papers: [], error })
  open(); await waitFor(() => expect(fixture.call).toHaveBeenCalled())
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Relationships' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
  await screen.findByText(error)
  expect(screen.getAllByText(error)).toHaveLength(1)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'People' }))
  fireEvent.click(screen.getByRole('button', { name: 'Ask' }))
  expect(screen.getAllByText(error)).toHaveLength(1)
})

it('a guide failure is still shown when its chat message is in another view', async () => {
  const error = 'The reading guide could not be completed. Please retry.'
  localStorage.setItem('bunko-book-consent-v2:1:DeepSeek', 'yes')
  fixture.call.mockImplementation(async action => action === 'messages' ? { messages: [], guide: null } : { id: 'failed', state: 'failed', kind: 'guide', question: 'Build reading guide', answer: '', papers: [], error })
  open(); await waitFor(() => expect(fixture.call).toHaveBeenCalled())
  fireEvent.click(screen.getByRole('button', { name: 'People' }))
  fireEvent.click(screen.getByRole('button', { name: 'Build reading guide' }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(error))
  fireEvent.click(screen.getByRole('button', { name: 'Ask' }))
  expect(screen.getAllByText(error)).toHaveLength(1)
})

it('all tabs keep a composer and reuse results; a visual followup points to the selected saved answer', async () => {
  localStorage.setItem('bunko-book-consent-v2:1:DeepSeek', 'yes')
  const old = { id: 'earlier', state: 'completed', kind: 'explore', question: 'Our first family tree', answer: guide.answer, papers: [], bookResponse: { ...guide, visibility: 'private' } }
  fixture.call.mockImplementation(async action => action === 'messages' ? { messages: [old], guide: null } : { ...old, id: 'continued' })
  open(); await screen.findByText('Our first family tree')
  for (const name of ['People', 'Places', 'Timeline']) {
    fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name }))
    expect(document.querySelector('.agent-composer textarea')).toBeInTheDocument()
  }
  fireEvent.click(screen.getByRole('button', { name: 'Check for updates' }))
  await waitFor(() => expect(fixture.call.mock.calls.filter(c => c[0] === 'messages').length).toBe(2))
  expect(fixture.call.mock.calls.filter(c => c[0] === 'send')).toHaveLength(0)
  fireEvent.change(screen.getByRole('combobox', { name: 'Reading scope' }), { target: { value: 'book' } })
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Extend the timeline across the whole book' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
  await waitFor(() => expect(fixture.call.mock.calls.filter(c => c[0] === 'send')).toHaveLength(1))
  const input = fixture.call.mock.calls.find(c => c[0] === 'send')![1]
  expect(input).toMatchObject({ kind: 'explore', focus: 'timeline', parentId: 'earlier', reference: { scope: 'book' } })
  expect(savedGuide(reference)).toBeNull()
})

it('an explicit new topic does not silently attach the latest private answer', async () => {
  localStorage.setItem('bunko-book-consent-v2:1:DeepSeek', 'yes')
  const old = { id: 'old', state: 'completed', kind: 'explore', question: 'Old topic', answer: guide.answer, papers: [], bookResponse: { ...guide, visibility: 'private' } }
  fixture.call.mockImplementation(async action => action === 'messages' ? { messages: [old], guide: null } : { ...old, id: 'fresh' })
  open(); await screen.findByText('Old topic')
  fireEvent.click(screen.getByRole('button', { name: 'Start a new topic' }))
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'A different question' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
  await waitFor(() => expect(fixture.call.mock.calls.some(c => c[0] === 'send')).toBe(true))
  const input = fixture.call.mock.calls.find(c => c[0] === 'send')![1]
  expect(input.newTopic).toBe(true); expect(input.parentId).toBeUndefined(); expect(input.baseGuideKey).toBeUndefined()
})

it('an inherited diagram keeps the later prose conversation as the followup parent', async () => {
  localStorage.setItem('bunko-book-consent-v2:1:DeepSeek', 'yes')
  const root = { id: 'root', state: 'completed', kind: 'explore', question: 'Family tree', answer: guide.answer, papers: [], bookResponse: { ...guide, visibility: 'private' } }
  const tip = { ...root, id: 'tip', parentId: 'root', question: 'Explain their motives', bookResponse: { ...guide, key: 'prose', parentId: 'root', visibility: 'private', people: undefined, relationships: undefined, places: undefined, routes: undefined, events: undefined } }
  fixture.call.mockImplementation(async action => action === 'messages' ? { messages: [root, tip], guide: null } : { ...tip, id: 'next' })
  open(); await screen.findByText('Explain their motives')
  fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name: 'People' }))
  fireEvent.change(document.querySelector('.agent-composer textarea')!, { target: { value: 'Add those motives to the graph' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
  await waitFor(() => expect(fixture.call.mock.calls.some(c => c[0] === 'send')).toBe(true))
  expect(fixture.call.mock.calls.find(c => c[0] === 'send')![1]).toMatchObject({ parentId: 'tip', focus: 'people' })
})


it('opens the nearest conversation tip, switches branches and keeps the draft without generating', async () => {
  const root = { id: 'root', state: 'completed', kind: 'explore', question: 'First nearby graph', answer: 'Nearby root', papers: [], bookResponse: { ...guide, key: 'root', visibility: 'private' } }
  const tip = { ...root, id: 'tip', parentId: 'root', question: 'Extend nearby graph', answer: 'Nearby extension', bookResponse: { ...guide, key: 'tip', reference: { ...reference, paragraph: 2 }, visibility: 'private' } }
  const far = { ...root, id: 'far', question: 'Distant branch', answer: 'Far away', bookResponse: { ...guide, key: 'far', reference: { ...reference, file: 'c9.json', chapter: 8 }, visibility: 'private' } }
  fixture.call.mockResolvedValue({ messages: [root, tip, far], guide: null })
  open(); await screen.findByText('Nearby extension')
  expect(screen.getByText('Nearby root')).toBeInTheDocument()
  expect(screen.queryByText('Far away')).not.toBeInTheDocument()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Do not lose this draft' } })
  fireEvent.change(screen.getByRole('combobox', { name: 'Conversations' }), { target: { value: 'far' } })
  expect(screen.getByText('Far away')).toBeInTheDocument()
  expect(screen.queryByText('Nearby extension')).not.toBeInTheDocument()
  expect(screen.getByRole('textbox')).toHaveValue('Do not lose this draft')
  fireEvent.change(screen.getByRole('combobox', { name: 'Conversations' }), { target: { value: '' } })
  expect(screen.getByText('Nearby extension')).toBeInTheDocument()
  expect(fixture.call.mock.calls.some(c => c[0] === 'send')).toBe(false)
})
