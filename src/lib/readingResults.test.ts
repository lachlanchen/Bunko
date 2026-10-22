// @vitest-environment jsdom
import { beforeEach, expect, it } from 'vitest'
import { closestReadingResult, readingResults, readingContinuation, saveGuide, savedGuides, type BookMessage, type BookReference, type BookResponse } from './bookCompanion'
const reference: BookReference = { id: 'garden', file: 'c1.json', chapter: 0, paragraph: 5, language: 'en', replyLanguage: 'en', scope: 'passage' }
const result = (key: string, ref = reference, extra: Partial<BookResponse> = {}): BookResponse => ({ key, revision: 'edition', reference: ref, answer: key, citations: [], insufficient: false, coverage: { chapter: ref.chapter, first: 0, last: ref.paragraph, total: 50, partial: false, scope: ref.scope, language: 'en' }, ...extra })
const message = (id: string, guide: BookResponse, parentId?: string): BookMessage => ({ id, state: 'completed', question: id, answer: guide.answer, papers: [], kind: 'explore', bookResponse: guide, parentId })
beforeEach(() => localStorage.clear())
it('shows the nearest saved scope, newest on ties, and permits selecting an earlier whole-book result', () => {
  const whole = result('whole', { ...reference, scope: 'book' }, { people: [] })
  const messages = [message('whole', whole), message('near', result('near', { ...reference, paragraph: 4 }, { people: [] })), message('exact-old', result('exact-old', reference, { people: [] })), message('exact-new', result('exact-new', reference, { people: [] })), message('far', result('far', { ...reference, chapter: 9, file: 'c10.json' }, { people: [] }))]
  const rows = readingResults(messages, [])
  expect(closestReadingResult(rows, reference, 'people')?.guide.key).toBe('exact-new')
  expect(closestReadingResult(rows, reference, 'people', 'whole')?.guide.key).toBe('whole')
  expect(closestReadingResult(rows, { ...reference, scope: 'book' }, 'people')?.guide.key).toBe('whole')
  expect(closestReadingResult(rows, { ...reference, id: 'another-book' }, 'people')).toBeUndefined()
})
it('each view inherits its latest result along the selected branch rather than an unrelated newer topic', () => {
  const root = result('root', reference, { people: [], relationships: [], places: [], routes: [], events: [] })
  const people = result('people', reference, { people: [], relationships: [], visibility: 'private' })
  const timeline = result('timeline', reference, { events: [], visibility: 'private' })
  const unrelated = result('unrelated', reference, { people: [], places: [], events: [], visibility: 'private' })
  const rows = readingResults([message('r', root), message('p', people, 'r'), message('t', timeline, 'p'), message('u', unrelated)], [])
  expect(closestReadingResult(rows, reference, 'people', 'timeline')?.guide.key).toBe('people')
  expect(closestReadingResult(rows, reference, 'places', 'timeline')?.guide.key).toBe('root')
  expect(closestReadingResult(rows, reference, 'timeline', 'timeline')?.guide.key).toBe('timeline')
  expect(closestReadingResult(rows, reference, 'chat', 'timeline')?.guide.key).toBe('timeline')
  const tip = rows.find(row => row.guide.key === 'timeline')!
  expect(readingContinuation(rows, tip, rows.find(row => row.guide.key === 'people'))?.guide.key).toBe('timeline')
  expect(readingContinuation(rows, rows.find(row => row.guide.key === 'unrelated'), rows.find(row => row.guide.key === 'people'))?.guide.key).toBe('people')
})
it('deduplicated public guides retain ancestor aliases and private results never enter the public cache', () => {
  const publicGuide = result('same', reference, { people: [], places: [] }), personal = result('private', reference, { visibility: 'private', events: [] })
  const rows = readingResults([message('old-root', publicGuide), message('new-root', publicGuide), message('followup', personal, 'old-root')], [])
  expect(rows).toHaveLength(2)
  expect(closestReadingResult(rows, reference, 'places', 'private')?.guide.key).toBe('same')
  saveGuide(reference, publicGuide); saveGuide(reference, { ...personal, people: [] })
  expect(savedGuides(reference).map(g => g.key)).toEqual(['same'])
  expect(JSON.stringify(localStorage)).not.toContain('private')
})
