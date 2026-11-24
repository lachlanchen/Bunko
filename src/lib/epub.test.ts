import { describe, expect, it, vi } from 'vitest'
import { strFromU8, unzipSync } from 'fflate'
import type { BookMeta, Chapter } from '../types'
import { createEpub } from './epub'
import { epubLanguages, EPUB_TYPE } from './epubOptions'

const book: BookMeta = {
  schema: 1, id: 'epub-demo', mode: 'interlinear', primary: 'ja',
  langs: ['ja', 'en', 'ar'], title: {}, titleText: { en: 'Sky & sea', ja: '空と海' },
  author: { name: 'A < B' }, bytes: 100, paras: 2,
  chapters: [{ n: 1, file: 'c0001.json', title: {}, bytes: 100, paras: 2 }],
}
const chapter: Chapter = {
  id: 'chapter-001', n: 1, title: { en: ['Above & below'], ja: [['海', 'うみ']] },
  p: [
    { id: 'p1', src: 'p1', u: [
      { src: 'one', en: ['See the sea. See the sky!'], ja: [['海', 'うみ'], '。空です。'], ar: ['السَّمَاءُ.'] },
      { src: 'two', en: ['One < two'], ja: ['一と二'], rich: { en: [{ text: 'One < two: ' }, { math: 'x^{2}\\bmod 2' }] } },
    ] },
    { id: 'p2', src: 'p2', kind: 'figure', figure: { path: 'assets/figure.png', caption: { en: 'Wave & shore' } }, u: [] },
  ],
}
const reads = () => ({
  chapter: vi.fn(async () => chapter), sentences: vi.fn(async () => null),
  image: vi.fn(async () => new Response(new Uint8Array([137, 80, 78, 71]))),
})
describe('Bunko EPUB generation', () => {
  it('uses current selection including original-only and fallbacks', () => {
    expect(epubLanguages(book, { langs: ['en', 'en', 'fr', 'ar'], layout: 'source' })).toEqual(['en'])
    expect(epubLanguages(book, { langs: ['fr'], layout: 'interlinear' })).toEqual(['ja'])
  })
  it('exports in selected order with real ruby, RTL, navigation, math and figures', async () => {
    const sources = reads()
    const result = await createEpub(book, { langs: ['en', 'ar', 'ja'], layout: 'interlinear', ruby: true }, { reads: sources })
    expect(result.type).toBe(EPUB_TYPE)
    expect(result.name).toBe('Sky sea.epub')
    const buffer = await result.arrayBuffer()
    const header = new DataView(buffer)
    expect(header.getUint16(8, true)).toBe(0)
    expect(header.getUint16(28, true)).toBe(0)
    expect(strFromU8(new Uint8Array(buffer).slice(30, 58))).toBe('mimetypeapplication/epub+zip')
    const entries = unzipSync(new Uint8Array(buffer))
    const html = strFromU8(entries['EPUB/chapter-1.xhtml'])
    const opf = strFromU8(entries['EPUB/content.opf'])
    expect(html.indexOf('See the sea.')).toBeLessThan(html.indexOf('السَّمَاء'))
    expect(html).toContain('See the sea. <br />See the sky!')
    expect(html).toContain('<ruby>海<rp>(</rp><rt>うみ</rt>')
    expect(html).toContain('lang="ar" xml:lang="ar" dir="rtl"')
    expect(html).toContain('<math ')
    expect(html).not.toMatch(/<mo[^>]*><mrow>/)
    expect(html).toContain('Wave &amp; shore')
    expect(opf).toContain('<dc:creator>A &lt; B</dc:creator>')
    expect(opf).toContain('properties="mathml"')
    expect(strFromU8(entries['EPUB/nav.xhtml'])).toContain('href="chapter-1.xhtml"')
    expect(entries['EPUB/image-1.png']).toEqual(new Uint8Array([137, 80, 78, 71]))
    expect(sources.image).toHaveBeenCalledWith('books/epub-demo/assets/figure.png', undefined)
  })
  it('groups paragraphs without mixing layers, and leaves the reader settings alone', async () => {
    const sources = reads(), settings = { langs: ['ja', 'en'], layout: 'paired', ruby: false } as const
    const file = await createEpub(book, { ...settings, langs: [...settings.langs] }, { reads: sources })
    const entries = unzipSync(new Uint8Array(await file.arrayBuffer()))
    const content = strFromU8(entries['EPUB/chapter-1.xhtml'])
    expect(content).toContain('海。空です。 一と二')
    expect(content).not.toContain('<ruby>')
    expect(content).not.toContain('<br />')
    expect(sources.sentences).not.toHaveBeenCalled()
    expect(settings.langs).toEqual(['ja', 'en'])
  })
  it('rejects a cancelled export, chapter mismatch and unavailable figure', async () => {
    const options = { langs: ['en'], layout: 'source', ruby: false } as const
    await expect(createEpub(book, { ...options, langs: ['en'] }, { signal: AbortSignal.abort(), reads: reads() })).rejects.toHaveProperty('name', 'AbortError')
    await expect(createEpub(book, { ...options, langs: ['en'] }, { reads: { ...reads(), chapter: async () => ({ ...chapter, n: 2 }) } })).rejects.toThrow('epub_edition_changed')
    await expect(createEpub(book, { ...options, langs: ['en'] }, { reads: { ...reads(), image: async () => { throw new Error('offline') } } })).rejects.toThrow('offline')
  })
})
