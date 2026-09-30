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
  it('interlaces aligned units with original pinyin/furigana and selected language order', () => {
    const aligned = { ...chapter, p: [{ id: 'a', src: '', u: [
      { src: '', en: ['Read.'], zh: [['读', 'dú'], '。'], ja: [['読む', 'よむ'], '。'] },
      { src: '', en: ['Write.'], zh: [['写', 'xiě'], '。'], ja: [['書く', 'かく'], '。'] },
    ] }] } as Chapter
    const result = watchExcerpt(meta, aligned, ['ja', 'zh', 'en', 'ja'], 0)
    expect(result.blocks).toEqual(['読む。\n\n读。\n\nRead.', '書く。\n\n写。\n\nWrite.'])
    expect(result.sentences?.[0].lines).toEqual([
      { lang: 'ja', tokens: [{ text: '読む', ruby: 'よむ' }, { text: '。' }] },
      { lang: 'zh', tokens: [{ text: '读', ruby: 'dú' }, { text: '。' }] },
      { lang: 'en', tokens: [{ text: 'Read.' }] },
    ])
    expect(result.truncated).toBe(false)
  })
  it('keeps missing languages absent without shifting another sentence into their place', () => {
    const partial = { ...chapter, p: [{ id: 'a', src: '', u: [
      { src: '', zh: ['甲。'] }, { src: '', en: ['Second.'], ja: ['次。'] },
    ] }] } as Chapter
    const result = watchExcerpt(meta, partial, ['en', 'zh', 'ja'], 0)
    expect(result.blocks).toEqual(['甲。', 'Second.\n\n次。'])
    expect(result.sentences?.map(s => s.lines.map(l => l.lang))).toEqual([['zh'], ['en', 'ja']])
    expect(result.sentences?.[0].lines[0].tokens).toEqual([{ text: '甲。' }])
  })
  it('caps aligned units and keeps structured/plain bounds in sync', () => {
    const many = { ...chapter, p: [{ id: 'a', src: '', u: Array.from({ length: 30 }, () => ({ src: '', zh: [['书', 'shū']] })) }] } as Chapter
    const result = watchExcerpt(meta, many, ['zh'], 0)
    expect(result.blocks).toHaveLength(24)
    expect(result.sentences).toHaveLength(24)
    expect(result.truncated).toBe(true)
  })
  it('counts ruby annotation bytes in the transfer budget', () => {
    const annotated = { ...chapter, p: [{ id: 'a', src: '', u: Array.from({ length: 24 }, () => ({ src: '', ja: Array.from({ length: 20 }, () => ['読む', 'よむ'.repeat(8)]) })) }] } as Chapter
    const result = watchExcerpt(meta, annotated, ['ja'], 0)
    expect(result.blocks.length).toBeGreaterThan(0)
    expect(result.sentences).toHaveLength(result.blocks.length)
    expect(new TextEncoder().encode(JSON.stringify(result)).length).toBeLessThan(14500)
    expect(result.truncated).toBe(true)
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
