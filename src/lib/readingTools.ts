import type { BookMeta, LangCode, Unit } from '../types'
import { plainText } from './text'

export function passageKey(meta: BookMeta, chapterFile: string, paragraphId: string, unitIndex: number): string {
  return [meta.id, chapterFile, paragraphId, unitIndex].join('/')
}

export function passageText(unit: Unit, lang: LangCode): string {
  return plainText(unit[lang]).trim()
}

export interface Definition { partOfSpeech: string; meaning: string }

interface WiktionaryEntry {
  partOfSpeech?: string
  definitions?: { definition?: string }[]
}

const section: Record<'en' | 'zh' | 'ja', string> = { en: 'en', zh: 'zh', ja: 'ja' }

export function dictionaryLanguage(lang: LangCode): 'en' | 'zh' | 'ja' {
  if (lang === 'en') return 'en'
  if (lang === 'ja' || lang === 'ja_modern') return 'ja'
  return 'zh'
}

export async function lookupWord(word: string, lang: LangCode, signal?: AbortSignal): Promise<Definition[]> {
  const clean = word.trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
  if (!clean) return []
  const cacheKey = `bunko:dict:${dictionaryLanguage(lang)}:${clean.toLowerCase()}`
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached) as Definition[]
  } catch { /* Storage may be disabled. */ }
  const results = dictionaryLanguage(lang) === 'zh'
    ? await lookupChinese(clean, signal)
    : await lookupRest(clean, lang, signal)
  try { localStorage.setItem(cacheKey, JSON.stringify(results)) } catch { /* Storage may be full. */ }
  return results
}

async function lookupRest(clean: string, lang: LangCode, signal?: AbortSignal): Promise<Definition[]> {
  const response = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(clean)}`, { signal })
  if (response.status === 404) return []
  if (!response.ok) throw new Error(`Wiktionary ${response.status}`)
  const data = await response.json() as Record<string, WiktionaryEntry[]>
  return (data[section[dictionaryLanguage(lang)]] ?? [])
    .flatMap((entry) => (entry.definitions ?? []).map((definition) => ({
      partOfSpeech: entry.partOfSpeech ?? '',
      meaning: definition.definition?.replace(/<[^>]*>/g, '').trim() ?? '',
    })))
    .filter((entry) => entry.meaning)
    .slice(0, 8)
}

async function lookupChinese(clean: string, signal?: AbortSignal): Promise<Definition[]> {
  const base = 'https://en.wiktionary.org/w/api.php'
  const sectionsUrl = `${base}?${new URLSearchParams({ action: 'parse', page: clean, prop: 'sections', format: 'json', origin: '*' })}`
  const sectionsResponse = await fetch(sectionsUrl, { signal })
  if (!sectionsResponse.ok) throw new Error(`Wiktionary ${sectionsResponse.status}`)
  const sectionsData = await sectionsResponse.json() as { parse?: { sections?: { index: string; line: string; toclevel: number }[] } }
  const sections = sectionsData.parse?.sections ?? []
  const start = sections.findIndex((item) => item.line === 'Chinese' && item.toclevel === 1)
  if (start < 0) return []
  const end = sections.findIndex((item, index) => index > start && item.toclevel === 1)
  const targets = sections.slice(start + 1, end < 0 ? undefined : end).filter((item) => item.line === 'Definitions').slice(0, 3)
  const groups = await Promise.all(targets.map(async (target) => {
    const url = `${base}?${new URLSearchParams({ action: 'parse', page: clean, prop: 'text', section: target.index, format: 'json', origin: '*' })}`
    const response = await fetch(url, { signal })
    if (!response.ok) return []
    const data = await response.json() as { parse?: { text?: { '*': string } } }
    const html = new DOMParser().parseFromString(data.parse?.text?.['*'] ?? '', 'text/html')
    return [...html.querySelectorAll('.mw-parser-output > ol > li')].map((item) => {
      const clone = item.cloneNode(true) as Element
      clone.querySelectorAll('ol, ul, dl').forEach((child) => child.remove())
      return { partOfSpeech: '', meaning: clone.textContent?.trim() ?? '' }
    }).filter((item) => item.meaning)
  }))
  return groups.flat().slice(0, 8)
}

export function discussionTitle(key: string): string {
  return `[Passage] ${key}`
}

export function discussionNewUrl(key: string, excerpt: string): string {
  const body = `> ${excerpt.slice(0, 500).replace(/\n/g, '\n> ')}\n\nPassage: ${key}\n\nWhat do you notice about this passage?`
  return `https://github.com/lachlanchen/bunko-books/issues/new?${new URLSearchParams({ title: discussionTitle(key), body, labels: 'passage' })}`
}
