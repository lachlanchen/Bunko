// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { BookGuide } from './BookGuide'
import type { BookResponse, GuideEntity } from '../lib/bookCompanion'

const citations = [{ passage: 'P1', paragraph: 0, quote: 'In 2000 Ada visited London; Ben had arrived in 1990.' }]
const entity = (id: string, name: string): GuideEntity => ({ id, name, detail: 'A person in this passage.', aliases: [], certainty: 'stated', citations })
const guide: BookResponse = { key: 'visual-fixture', revision: 'fixture', answer: 'A reading guide.', citations, insufficient: false,
  reference: { id: 'fixture', chapter: 0, paragraph: 0, file: 'c0001.json', language: 'en', replyLanguage: 'en', scope: 'chapter' },
  coverage: { chapter: 0, first: 0, last: 0, total: 1, partial: false, scope: 'chapter', language: 'en' },
  people: [entity('ada', 'Ada'), entity('ben', 'Ben')], relationships: [{ from: 'ada', to: 'ben', label: 'Siblings', direction: 'mutual', certainty: 'stated', citations }],
  places: [entity('london', 'London'), entity('imaginary', 'The Kingdom of Invisible Clouds')], routes: [],
  events: [{ title: 'Ada arrives', when: '2000', detail: 'Ada visits London.', certainty: 'stated', citations }, { title: 'Ben arrives', when: '1990', detail: 'Ben arrives earlier.', certainty: 'stated', citations }, { title: 'A later meeting', when: 'Later', detail: 'No exact date is given.', certainty: 'interpretation', citations }],
}
beforeEach(() => { localStorage.clear(); vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }) })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('graph nodes and edges open their evidence, support keyboard and keep labels as text', () => {
  const read = vi.fn(), { container } = render(<BookGuide guide={guide} tab="people" ui="en" onRead={read} />)
  const node = container.querySelector('.graph-person')!
  fireEvent.keyDown(node, { key: 'Enter' })
  expect(container.querySelectorAll('.guide-entity-grid .guide-card')).toHaveLength(1)
  fireEvent.click(screen.getAllByText(/Source passages/)[0])
  fireEvent.click(screen.getAllByRole('button', { name: 'Read passage · P1' })[0])
  expect(read).toHaveBeenCalledWith(0, citations[0])
  fireEvent.click(screen.getByRole('button', { name: 'Tree layout' }))
  expect(container.querySelectorAll('.graph-person')).toHaveLength(2)
  fireEvent.click(container.querySelector('.graph-connection')!)
  expect(container.querySelector('.guide-connection.selected')).toHaveTextContent('Siblings')
  expect(container.querySelector('svg[data-no-swipe=true]')).not.toBeNull()
})

it('timeline has a proportional date axis, preserves narrative view and keeps unknown dates separate', () => {
  const { container } = render(<BookGuide guide={guide} tab="timeline" ui="en" onRead={() => {}} />)
  expect(container.querySelector('.guide-timeline li')).toHaveTextContent('Ben arrives')
  expect(screen.getByText('Without a confirmed date')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '2000: Ada arrives' }))
  expect(container.querySelector('#guide-event-0')).toHaveClass('selected')
  fireEvent.click(screen.getByRole('button', { name: 'In the text' }))
  expect(container.querySelector('.guide-timeline li')).toHaveTextContent('Ada arrives')
})

it('keeps simultaneous timeline events on separate selectable lanes', () => {
  const events = Array.from({ length: 48 }, (_, i) => ({ ...guide.events![0], title: `Event ${i}`, when: '2000' }))
  const { container } = render(<BookGuide guide={{ ...guide, events }} tab="timeline" ui="en" onRead={() => {}} />)
  const markers = [...container.querySelectorAll('.time-marker circle')]
  expect(markers).toHaveLength(48)
  expect(new Set(markers.map(n => n.getAttribute('cy'))).size).toBe(48)
  expect(screen.getByRole('button', { name: '2000: Event 47' })).toBeInTheDocument()
})

it('ambiguous geography requires a choice, never places fiction, and remembers a device-only pin', async () => {
  const { container } = render(<BookGuide guide={guide} tab="places" ui="en" onRead={() => {}} />)
  await screen.findByText('Map data: Natural Earth · public domain', {}, { timeout: 5000 })
  expect(container.querySelectorAll('.atlas-pin')).toHaveLength(0)
  const results = container.querySelector('.guide-location-results')!
  const options = within(results as HTMLElement).getAllByRole('button')
  expect(options.length).toBeGreaterThan(1)
  const london = options.find(button => button.textContent?.includes('United Kingdom'))!
  expect(london).toBeDefined(); fireEvent.click(london)
  await waitFor(() => expect(container.querySelectorAll('.atlas-pin.confirmed')).toHaveLength(1))
  expect(JSON.parse(localStorage.getItem('bunko-atlas-v1:visual-fixture')!)).toHaveProperty('london')
  cleanup()
  const again = render(<BookGuide guide={guide} tab="places" ui="en" onRead={() => {}} />)
  await waitFor(() => expect(again.container.querySelectorAll('.atlas-pin.confirmed')).toHaveLength(1))
  fireEvent.click(screen.getByRole('button', { name: 'Story map' }))
  expect(again.container.querySelectorAll('.graph-person')).toHaveLength(2)
}, 15000)
