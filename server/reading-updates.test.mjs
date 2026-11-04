import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyReadingUpdate, updateBases, stableEntries, readingTask } from './agent/reading-updates.mjs'
import { validateBookResponse } from './agent/book-companion.mjs'
import { readingMemory, readingBranch } from './agent/book-memory.mjs'
const ref = { id: 'garden', file: 'c1.json', chapter: 0, paragraph: 1, scope: 'passage', language: 'en', replyLanguage: 'en' }
const context = { reference: { ...ref, file: 'c2.json', chapter: 1 }, passages: [{ id: 'P1', paragraph: 0, text: 'Ada meets Cy.' }] }
const person = (id, name = id) => ({ id, name, aliases: [], detail: name, certainty: 'background', citations: [] })
const edge = (from, to, label = 'Knows') => ({ from, to, label, direction: 'forward', certainty: 'background', citations: [] })
const answer = { answer: 'More detail from book knowledge.', knowledge: 'background', citations: [] }
const snapshot = { reference: ref, people: [{ ...person('ada', 'Ada'), certainty: 'stated', citations: [{ passage: 'P1', paragraph: 0, quote: 'An earlier verified passage.' }] }, person('ben', 'Ben')], relationships: [edge('ada', 'ben')] }
const apply = (raw, snapshots = { people: snapshot }) => applyReadingUpdate(validateBookResponse(raw, context, 'explore', updateBases(raw, snapshots)), raw, snapshots, context.reference)

test('incremental extension retains every prior entry and its original source across chapters', () => {
  const original = JSON.stringify(snapshot)
  const result = apply({ ...answer, people: [{ ...person('cy', 'Cy'), certainty: 'stated', citations: [{ passage: 'P1', quote: 'Ada meets Cy.' }] }], relationships: [edge('ada', 'cy')] })
  assert.deepEqual(result.people.map(p => p.id), ['ada', 'ben', 'cy'])
  assert.equal(result.relationships.length, 2)
  assert.deepEqual(result.people[0].citations[0], { passage: 'P1', paragraph: 0, quote: 'An earlier verified passage.', chapter: 0, file: 'c1.json' })
  assert.equal(result.people[2].citations[0].file, 'c2.json')
  assert.equal(JSON.stringify(snapshot), original)
  assert.equal(result.places, undefined)
})
test('new quotes still fail validation; inherited sources are not fabricated as current evidence', () => {
  assert.throws(() => apply({ ...answer, people: [{ ...person('cy'), certainty: 'stated', citations: [{ passage: 'P1', quote: 'An earlier verified passage.' }] }], relationships: [] }), /quotation/)
})
test('32 new people extend an existing 32-person graph without the old snapshot cap', () => {
  const prior = { people: { reference: ref, people: Array.from({ length: 32 }, (_, i) => person(`p${i}`)), relationships: [] } }
  const value = apply({ ...answer, people: Array.from({ length: 32 }, (_, i) => person(`p${i + 32}`)), relationships: Array.from({ length: 32 }, (_, i) => edge('p0', `p${i + 32}`)) }, prior)
  assert.equal(value.people.length, 64); assert.equal(value.relationships.length, 32)
  assert.equal(new Set(value.people.map(p => p.id)).size, 64)
})
test('corrections use stable ids; alias duplicates resolve without dropping old connections', () => {
  const corrected = apply({ ...answer, people: [{ ...person('new-ada', 'Ada'), detail: 'Corrected detail.' }], relationships: [edge('new-ada', 'ben')] })
  assert.equal(corrected.people.length, 2); assert.equal(corrected.people[0].id, 'ada')
  assert.equal(corrected.relationships.length, 1)
  const relationship = corrected.relationships[0]
  const followup = apply({ ...answer, people: [], relationships: [{ ...relationship, label: 'Siblings' }] }, { people: { ...corrected, reference: context.reference } })
  assert.equal(followup.relationships.length, 1); assert.equal(followup.relationships[0].label, 'Siblings')
})
test('explicit deletion removes dependent old edges; unknown or dangling updates are repaired', () => {
  const result = apply({ ...answer, people: [], relationships: [], remove: { people: ['ben'] } })
  assert.deepEqual(result.people.map(p => p.id), ['ada']); assert.equal(result.relationships.length, 0)
  assert.throws(() => apply({ ...answer, people: [], relationships: [], remove: { people: ['nobody'] } }), /correction/)
  assert.throws(() => apply({ ...answer, people: [], relationships: [edge('ada', 'nobody')] }), /unknown connection/)
})
test('timeline and routes extend and correct by stable id; explicit replacement starts another map', () => {
  const event = { title: 'Arrival', when: '', detail: 'They arrive.', certainty: 'background', citations: [] }
  const snapshots = { timeline: { reference: ref, events: [event] }, places: { reference: ref, mapYear: 191, places: [person('a'), person('b')], routes: [edge('a', 'b')] } }
  const id = stableEntries('events', [event], ref)[0].id
  const result = apply({ ...answer, events: [{ ...event, id, detail: 'The corrected arrival.' }, { ...event, title: 'Departure' }], places: [person('c')], routes: [edge('b', 'c')] }, snapshots)
  assert.equal(result.events.length, 2); assert.equal(result.events[0].detail, 'The corrected arrival.')
  assert.equal(result.places.length, 3); assert.equal(result.routes.length, 2); assert.equal(result.mapYear, 191)
  const other = apply({ ...answer, updateModes: { places: 'replace' }, places: [person('d'), person('e')], routes: [edge('d', 'e')] }, snapshots)
  assert.deepEqual(other.places.map(p => p.id), ['d', 'e']); assert.equal(other.mapYear, undefined)
})
test('complex graph extensions choose capability before the first call; simple questions stay economical', () => {
  const memory = { lastView: 'people', visuals: { people: { people: Array.from({ length: 20 }, (_, i) => person(String(i))) } } }
  assert.deepEqual(readingTask('增强一下这张图，更详细一些，整个三个集团的谋士和重要人物', 'explore', 'chat', memory, ref), { focus: 'people', quality: 'capable' })
  assert.equal(readingTask('What does this word mean?', 'explore', 'chat', memory, ref).quality, 'standard')
  assert.equal(readingTask('Add more detail', 'explore', 'chat', memory, ref).quality, 'capable')
})
test('nearest branch restores its latest continuation while unrelated later branches stay separate', () => {
  const turn = (id, reference, parentId) => ({ id, state: 'completed', parentId, question: id, answer: id, bookResponse: { ...answer, reference } })
  const messages = [turn('root', ref), turn('extended', { ...ref, paragraph: 6 }, 'root'), turn('elsewhere', { ...ref, file: 'c9.json', chapter: 8 })]
  assert.deepEqual(readingBranch(messages, ref).map(m => m.id), ['root', 'extended'])
  assert.deepEqual(readingBranch(messages, { ...ref, file: 'c10.json', chapter: 9 }).map(m => m.id), ['elsewhere'])
  assert.deepEqual(readingBranch(messages.slice(0, 2), { ...ref, file: 'c10.json', chapter: 9 }).map(m => m.id), ['root', 'extended'])
  assert.equal(readingBranch(messages, { ...ref, id: 'other' }).length, 0)
  assert.equal(readingBranch(messages, { ...ref, replyLanguage: 'ja' }).length, 0)
  const memory = readingMemory([{ ...turn('graph', ref), bookResponse: snapshot }])
  assert.equal(memory.visuals.people.people[0].citations, undefined)
  assert.equal(memory.snapshots.people.people[0].citations[0].file, 'c1.json')
})
