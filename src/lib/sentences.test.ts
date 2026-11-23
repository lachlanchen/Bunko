import { expect, it, vi } from 'vitest'
import type { Line, Paragraph } from '../types'
import { makeChapterSentenceMap, sentenceBreaks, sentenceLines } from './sentences'
import { plainText } from './text'

const text = (lines: Line[]) => lines.map(plainText)

it('keeps titles, initials, decimal numbers, ellipses, quotes, and URLs intact', () => {
  const line = ['Dr. A. Smith paid $3.50. “Done!” she said. See https://example.com/a.b. Start again.']
  const parts = text(sentenceLines(line, 'en'))
  expect(parts.join('')).toBe(line[0])
  expect(parts[0]).toBe('Dr. A. Smith paid $3.50. ')
  expect(parts.some(part => part.includes('https://example.com/a.b.'))).toBe(true)
  expect(text(sentenceLines(['Wait... still here. Then leave.'], 'en'))).toEqual(['Wait... still here. ', 'Then leave.'])
})

it('splits East Asian and Arabic sentences without changing tokens, reading or direction text', () => {
  const first: Line = [['読む', 'よむ', 'p'], '。'], second: Line = [['書く', 'かく', 'p'], '。']
  expect(sentenceLines([...first, ...second], 'ja_modern')).toEqual([first, second])
  expect(text(sentenceLines(['大家好。今天读书！明天见。'], 'zh_modern'))).toEqual(['大家好。', '今天读书！', '明天见。'])
  expect(text(sentenceLines(['أين الكتاب؟ هنا. هيا بنا!'], 'ar'))).toEqual(['أين الكتاب؟ ', 'هنا. ', 'هيا بنا!'])
})

it('keeps annotated tokens whole and discards stale or unsorted display offsets', () => {
  const atomic: Line = [['前。後', 'ぜん ご'], '。次。']
  expect(sentenceLines(atomic, 'ja', [2])).toEqual([[atomic[0], '。'], ['次。']])
  const plain: Line = ['First. Second. Last.']
  expect(sentenceLines(plain, 'en', [15, 7])).toEqual(sentenceLines(plain, 'en'))
  expect(text(sentenceLines(plain, 'en', [15]))).toEqual(['First. Second. ', 'Last.'])
})

it('can split unambiguous punctuation offline in older WebViews', () => {
  vi.stubGlobal('Intl', { ...Intl, Locale: Intl.Locale, Segmenter: undefined })
  try {
    expect(text(sentenceLines(['Ինչպե՞ս ես։ Լավ։'], 'hy'))).toEqual(['Ինչպե՞ս ես։ ', 'Լավ։'])
    expect(sentenceBreaks(['Dr. Brown. Next.'], 'en-u-ss-standard')).toEqual([])
  } finally { vi.unstubAllGlobals() }
})

it('creates independent offsets inside each existing aligned unit and leaves notes and rich text alone', () => {
  const unit = { src: '', en: ['One. Two.'], ja: ['一文だけ。'] }
  const passage: Paragraph = { id: 'p', src: '', u: [unit, { ...unit, rich: { en: [{ math: '1+2' }] } }] }
  expect(makeChapterSentenceMap([passage, { ...passage, id: 'x-notes' }, { ...passage, kind: 'figure', figure: { path: 'assets/x.png' } }])).toEqual({ '0.0': { en: [5] } })
})
