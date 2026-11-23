import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import type { Chapter, Line, Paragraph } from '../types'
import { baseLanguage, htmlLanguage, unitLanguages, unitLine } from './languages'
import { plainText, tokenParts } from './text'

export type ChapterSentenceMap = Record<string, Record<string, number[]>>
export type BookSentenceMap = Record<string, { chapterHash: string; units: ChapterSentenceMap }>

// The parsed chapter hash also works for downloaded legacy chapters whose
// filenames predate content addressing. Never apply cuts to a different edition.
export function sentenceChapterHash(chapter: Chapter) {
  return bytesToHex(sha256(new TextEncoder().encode(JSON.stringify(chapter))))
}

const segmenters = new Map<string, Intl.Segmenter>()
const end = /([.!?…。！？؟۔।॥።፧։])(?:[\p{Pe}\p{Pf}"'’”]+)?\s*$/u
const titles = /(?:^|\s)(?:Mr|Mrs|Ms|Mx|Dr|Prof|Rev|Sr|Jr|St|Mt|Gen|Capt|Lt|Col|Sgt|Gov|Sen|Rep|Hon|Fr|Br|Fig|Eq|No|vs|cf|etc|e\.g|i\.e)\.$/i
const initials = /(?:^|[\s(])(?:\p{Lu}\.)+$/u
const linkAtEnd = /(?:https?:\/\/|www\.|[^\s@]+@)[^\s]*$/i

/** Candidate sentence ends in UTF-16 offsets. Shorter views never zip languages. */
export function sentenceBreaks(line: Line, lang: string): number[] {
  const text = plainText(line)
  if (text.length < 3 || !/[.!?…。！？؟۔।॥።፧։]/u.test(text)) return []
  const locale = htmlLanguage(lang)
  let segmenter = segmenters.get(locale)
  if (!segmenter && typeof Intl.Segmenter === 'function') {
    try { segmenter = new Intl.Segmenter(locale, { granularity: 'sentence' }) }
    catch { /* A private or unsupported locale can use the engine default. */ }
    if (segmenter && segmenters.size < 64) segmenters.set(locale, segmenter)
  }
  const candidates = segmenter
    ? Array.from(segmenter.segment(text), part => part.index + part.segment.length)
    // Older WebViews can identify unequivocal full stops and question marks.
    : Array.from(text.matchAll(/[。！？؟۔।॥።፧։!?][\p{Pe}\p{Pf}"'’”]*\s*/gu), match => match.index + match[0].length)
  const cuts: number[] = []
  let last = 0
  for (const offset of candidates) {
    if (offset >= text.length || !text.slice(offset).trim()) break
    const before = text.slice(last, offset).trimEnd()
    const terminal = before.match(end)?.[1]
    if (!terminal || /^[\s\p{P}\p{S}]*$/u.test(before)) continue
    if (terminal === '.' && (initials.test(before) || baseLanguage(lang) === 'en' && titles.test(before))) continue
    if (linkAtEnd.test(before) && !/\s/u.test(text[offset - 1])) continue
    cuts.push(offset)
    last = offset
  }
  return safeBreaks(line, cuts)
}

/** Require sorted, internal boundaries. A boundary cannot divide a ruby token or a grapheme. */
function safeBreaks(line: Line, cuts: readonly number[]): number[] {
  const text = plainText(line)
  let tokenStart = 0, tokenIndex = 0, previous = 0
  const safe: number[] = []
  for (const cut of cuts) {
    if (!Number.isSafeInteger(cut) || cut <= previous || cut >= text.length) return []
    previous = cut
    const after = text.slice(cut)
    if (!after.trim() || !end.test(text.slice(0, cut)) || /^[\uDC00-\uDFFF\p{M}\u200D]/u.test(after) || text[cut - 1] === '\u200D') continue
    while (tokenIndex < line.length && tokenStart + tokenParts(line[tokenIndex]).text.length <= cut) {
      tokenStart += tokenParts(line[tokenIndex]).text.length
      tokenIndex++
    }
    if (tokenIndex < line.length && cut > tokenStart && tokenParts(line[tokenIndex]).reading) continue
    safe.push(cut)
  }
  return safe
}

/** Split plain tokens as needed while preserving every source character, role and ruby. */
export function sentenceLines(line: Line, lang: string, published?: number[]): Line[] {
  const validated = Array.isArray(published) ? safeBreaks(line, published) : []
  const cuts = validated.length && validated.length === published?.length ? validated : sentenceBreaks(line, lang)
  if (!cuts.length) return [line]
  const result: Line[] = [[]]
  let start = 0, index = 0
  for (const token of line) {
    const { text, reading, role } = tokenParts(token)
    const finish = start + text.length
    let position = 0
    while (index < cuts.length && cuts[index] <= finish) {
      const next = cuts[index++] - start
      if (next > position) result.at(-1)!.push(next === text.length && position === 0 ? token : role ? [text.slice(position, next), reading, role] : text.slice(position, next))
      result.push([])
      position = next
    }
    if (position < text.length || !text) result.at(-1)!.push(!position ? token : role ? [text.slice(position), reading, role] : text.slice(position))
    start = finish
  }
  return result
}

export function canSplitSentences(paragraph: Paragraph) {
  return !paragraph.figure && (!paragraph.kind || paragraph.kind === 'text') && !paragraph.id.endsWith('-notes')
}

export function makeChapterSentenceMap(paragraphs: Paragraph[]): ChapterSentenceMap {
  const map: ChapterSentenceMap = {}
  paragraphs.forEach((paragraph, paragraphIndex) => {
    if (!canSplitSentences(paragraph)) return
    paragraph.u.forEach((unit, unitIndex) => {
      if (unit.annotation || unit.rich) return
      for (const lang of unitLanguages(unit)) {
        const cuts = sentenceBreaks(unitLine(unit, lang)!, lang)
        if (cuts.length) (map[`${paragraphIndex}.${unitIndex}`] ??= Object.create(null))[lang] = cuts
      }
    })
  })
  return map
}
