import { describe, expect, it } from 'vitest'
import { watchExcerpt } from './watchReading'
import type { BookMeta, Chapter } from '../types'

const meta = { id: 'test', primary: 'en', titleText: { en: 'A book' } } as BookMeta
const chapter = { id: 'test', n: 1, title: { en: ['Chapter one'] }, p: [
  { id: 'a', src: '', u: [{ src: '', en: ['First'], zh: ['第一'] }] },
  { id: 'b', src: '', u: [{ src: '', en: ['Second'], zh: ['第二'] }] },
] } as Chapter

describe('Watch excerpt', () => {
  it('starts at the visible paragraph and preserves selected languages', () => {
    expect(watchExcerpt(meta, chapter, ['en', 'zh'], 1).blocks).toEqual(['Second\n\n第二'])
  })
  it('never silently flattens a mathematical or illustrated passage', () => {
    const illustrated = structuredClone(chapter)
    illustrated.p[1].figure = { path: 'figures/test.png' }
    const result = watchExcerpt(meta, illustrated, ['en'], 0)
    expect(result.blocks).toEqual(['First'])
    expect(result.truncated).toBe(true)
  })
  it('bounds multibyte payloads for WatchConnectivity', () => {
    const long = { ...chapter, p: Array.from({ length: 30 }, (_, i) => ({ id: String(i), src: '', u: [{ src: '', zh: ['文'.repeat(1800)] }] })) } as Chapter
    const result = watchExcerpt(meta, long, ['zh'], 0)
    expect(new TextEncoder().encode(JSON.stringify(result)).length).toBeLessThan(15000)
    expect(result.truncated).toBe(true)
    expect(result.blocks.length).toBeGreaterThan(0)
  })
})
