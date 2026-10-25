// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { BookGuide } from './BookGuide'
import type { BookResponse, GuideEntity } from '../lib/bookCompanion'
import han from '../../server/agent/han-regions.json'

const citations = [{ passage: 'P1', paragraph: 0, quote: 'In 2000 Ada visited London; Ben had arrived in 1990.' }]
const entity = (id: string, name: string): GuideEntity => ({ id, name, detail: 'A person in this passage.', aliases: [], certainty: 'stated', citations })
const guide: BookResponse = { key: 'visual-fixture', revision: 'fixture', answer: 'A reading guide.', citations, insufficient: false,
  reference: { id: 'fixture', chapter: 0, paragraph: 0, file: 'c0001.json', language: 'en', replyLanguage: 'en', scope: 'chapter' },
  coverage: { chapter: 0, first: 0, last: 0, total: 1, partial: false, scope: 'chapter', language: 'en' },
  people: [entity('ada', 'Ada'), entity('ben', 'Ben')], relationships: [{ from: 'ada', to: 'ben', label: 'Siblings', direction: 'mutual', certainty: 'stated', citations }],
  places: [entity('london', 'London'), entity('imaginary', 'The Kingdom of Invisible Clouds')], routes: [],
  events: [{ title: 'Ada arrives', when: '2000', detail: 'Ada visits London.', certainty: 'stated', citations }, { title: 'Ben arrives', when: '1990', detail: 'Ben arrives earlier.', certainty: 'stated', citations }, { title: 'A later meeting', when: 'Later', detail: 'No exact date is given.', certainty: 'interpretation', citations }],
}
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }) })
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
  cleanup()
  const reopened = render(<BookGuide guide={guide} tab="timeline" ui="en" onRead={() => {}} />)
  expect(reopened.container.querySelector('#guide-event-0')).toHaveClass('selected')
  expect(reopened.container.querySelector('.guide-timeline li')).toHaveTextContent('Ada arrives')
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
  await screen.findByText(/These places have no confirmed geographic match/, {}, { timeout: 5000 })
  expect(container.querySelector('.atlas-land')).toBeNull()
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
  fireEvent.click(screen.getByRole('button', { name: 'Reset location suggestion' }))
  await waitFor(() => expect(again.container.querySelectorAll('.atlas-pin')).toHaveLength(0))
  expect(JSON.parse(localStorage.getItem('bunko-atlas-v1:visual-fixture')!)).not.toHaveProperty('london')
  fireEvent.click(screen.getByRole('button', { name: 'Story map' }))
  expect(again.container.querySelectorAll('.graph-person')).toHaveLength(2)
}, 15000)


it('renders the current Foguoji stops and routes, exposes gaps, and changes the map with the result', async () => {
  const reference = { ...guide.reference, id: 'foguoji' }
  const places = [entity('start', '長安'), entity('desert', '燉煌'), entity('khotan', '于闐'), entity('unknown', '竭叉')]
  const routes = [{ from: 'start', to: 'desert', label: 'Westward', direction: 'forward' as const, certainty: 'background' as const, citations: [] },
    { from: 'desert', to: 'khotan', label: 'Onward', certainty: 'background' as const, citations: [] },
    { from: 'khotan', to: 'unknown', label: 'Uncertain location', certainty: 'background' as const, citations: [] }]
  const { container, rerender } = render(<BookGuide guide={{ ...guide, reference, places, routes }} tab="places" ui="en" onRead={() => {}} />)
  await waitFor(() => expect(container.querySelectorAll('.atlas-pin')).toHaveLength(3))
  expect(container.querySelectorAll('.atlas-route-control')).toHaveLength(2)
  expect(screen.getByText('Located places: 3/4')).toBeInTheDocument()
  expect(screen.getByText('Mapped connections: 2/3')).toBeInTheDocument()
  expect(container.querySelector('.atlas-unresolved')).toHaveTextContent('竭叉')
  expect(container.querySelector('.atlas-route[marker-end]')).not.toBeNull()
  const coast = container.querySelector('.atlas-land')!.getAttribute('d')
  fireEvent.click(container.querySelector('.atlas-route-control')!)
  expect(container.querySelector('.guide-connection.selected')).toHaveTextContent('Westward')
  rerender(<BookGuide guide={{ ...guide, key: 'next-result', reference, places: [entity('patna','巴連弗邑'),entity('port','多摩梨帝')], routes: [] }} tab="places" ui="en" onRead={() => {}} />)
  await waitFor(() => expect(container.querySelectorAll('.atlas-pin')).toHaveLength(2))
  expect(container.querySelectorAll('.atlas-route-control')).toHaveLength(0)
  expect(container.querySelector('.atlas-land')!.getAttribute('d')).not.toBe(coast)
  expect(container.querySelector('.atlas-pin')?.getAttribute('aria-label')).toContain('Patna')
  fireEvent.click(screen.getByText('Find a location ·', { exact: false, selector: 'summary' }))
  expect(screen.getByRole('link', {name:'Location source 1'})).toHaveAttribute('href','https://www.gutenberg.org/cache/epub/64535/pg64535-images.html')
})

it('draws every requested Han region with a distinct color, visible name, dated source and usable selection', async () => {
  const places = han.regions.map(r => ({ ...entity(r.id, r.name), locationId: r.id, certainty: 'background' as const, citations: [] }))
  const current = { ...guide, key: 'han-map', mapYear: 191, reference: { ...guide.reference, id: 'zizhi-tongjian' }, places, routes: [] }
  const { container, rerender } = render(<BookGuide guide={current} tab="places" ui="zh-Hans" onRead={() => {}} />)
  await waitFor(() => expect(container.querySelectorAll('.atlas-region')).toHaveLength(13))
  expect(container.querySelectorAll('.atlas-region-label text')).toHaveLength(13)
  expect(new Set([...container.querySelectorAll('.atlas-region')].map(p => p.getAttribute('style'))).size).toBe(13)
  expect(container.querySelector('.atlas-period')).toHaveTextContent('约公元140年')
  expect(container.querySelectorAll('.atlas-borders')).toHaveLength(0)
  const jing = container.querySelector('.atlas-region[aria-label="荆州"]')!
  fireEvent.keyDown(jing, { key: 'Enter' })
  expect(container.querySelector('.guide-entity-grid')).toHaveTextContent('荆州')
  const cities = [['luoyang', '洛阳', '1159147063'], ['changan', '长安', '1159151363'], ['xiangyang', '襄阳', '1159148459']].map(([id, name, locationId]) => ({ ...entity(id, name), locationId }))
  rerender(<BookGuide guide={{ ...current, key: 'with-cities', places: [...places, ...cities] }} tab="places" ui="zh-Hans" onRead={() => {}} />)
  await waitFor(() => expect(container.querySelectorAll('.atlas-city-label text')).toHaveLength(3))
  expect([...container.querySelectorAll('.atlas-city-label text')].map(n => n.textContent)).toEqual(['洛阳', '长安', '襄阳'])
  expect(container.querySelectorAll('.atlas-city-anchor')).toHaveLength(3)
  expect(container.querySelectorAll('.atlas-region')).toHaveLength(13)
  rerender(<BookGuide guide={{ ...current, key: 'fewer-regions', places: places.slice(0, 3) }} tab="places" ui="zh-Hans" onRead={() => {}} />)
  await waitFor(() => expect(container.querySelectorAll('.atlas-region')).toHaveLength(3))
})
