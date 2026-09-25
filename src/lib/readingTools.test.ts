// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { dictionaryLanguage, discussionNewUrl, lookupWord, passageKey } from './readingTools'
import type { BookMeta } from '../types'

afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })

it('uses a stable chapter and passage anchor across display languages', () => {
  const meta = { id: 'sample' } as BookMeta
  const key = passageKey(meta, 'c001.json', 'p1', 2)
  expect(key).toBe('sample/c001.json/p1/2')
  const url = new URL(discussionNewUrl(key, 'A sentence'))
  expect(url.searchParams.get('title')).toBe(`[Passage] ${key}`)
  expect(url.searchParams.get('body')).toContain(`Passage: ${key}`)
})

it('looks up Japanese words in the Japanese entry and caches definitions', async () => {
  const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ ja: [{ partOfSpeech: 'Noun', definitions: [{ definition: '<span>book</span>' }] }], en: [{ definitions: [{ definition: 'wrong language' }] }] }) }))
  vi.stubGlobal('fetch', fetchMock)
  expect(dictionaryLanguage('ja_modern')).toBe('ja')
  expect(await lookupWord('本', 'ja')).toEqual([{ partOfSpeech: 'Noun', meaning: 'book' }])
  expect(await lookupWord('本', 'ja')).toEqual([{ partOfSpeech: 'Noun', meaning: 'book' }])
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

it('extracts Chinese definitions from the Chinese section only', async () => {
  const fetchMock = vi.fn(async (url: string) => ({ ok: true, json: async () => url.includes('prop=sections')
    ? { parse: { sections: [{ index: '1', line: 'Chinese', toclevel: 1 }, { index: '2', line: 'Definitions', toclevel: 2 }, { index: '3', line: 'Japanese', toclevel: 1 }, { index: '4', line: 'Definitions', toclevel: 2 }] } }
    : { parse: { text: { '*': '<div class="mw-parser-output"><ol><li>a path<dl><dd>example</dd></dl></li></ol></div>' } } } }))
  vi.stubGlobal('fetch', fetchMock)
  expect(await lookupWord('道', 'wenyan')).toEqual([{ partOfSpeech: '', meaning: 'a path' }])
  expect(fetchMock).toHaveBeenCalledTimes(2)
})
