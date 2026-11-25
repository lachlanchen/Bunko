import { expect, it } from 'vitest'
import type { Chapter } from '../types'
import { chineseReadingOptions, readingScriptView, selectedReadingLanguages, sourceReadingLanguage } from './chineseEdition'
import { chapterDisplayTitle } from './localizedBook'

const chapter: Chapter = {
  id: 'chapter-1', n: 1, title: { zh: ['经典力学'], ja: [['力学', 'りきがく']] },
  p: [{ id: 'one', src: 'shared-passage', u: [{ src: 'same-unit', zh: [['汉语', 'hàn yǔ'], '。'], rich: { zh: [{ text: '动量' }, { math: 'p=mv' }] } }] }],
}

it('adds the missing script only for Chinese editions and keeps script preferences across books', () => {
  expect(chineseReadingOptions(['ja'])).toEqual(['ja'])
  expect(chineseReadingOptions(['wenyan', 'zh_modern', 'en'])).toEqual(['wenyan', 'zh_modern', 'en', 'zh-Hant'])
  expect(chineseReadingOptions(['en', 'zh', 'zh-Hant'])).toEqual(['en', 'zh', 'zh-Hant'])
  expect(selectedReadingLanguages(['zh', 'en'], ['zh-Hant', 'en'])).toEqual(['zh-Hans', 'en'])
  expect(selectedReadingLanguages(['zh-Hans', 'en'], ['wenyan', 'zh_modern', 'en'])).toEqual(['zh_modern', 'en'])
  expect(sourceReadingLanguage('zh-Hant', ['wenyan', 'zh_modern', 'en'])).toBe('zh_modern')
})

it('converts offline, preserves equation and ruby tokens, and lets edited data win', () => {
  const derived = readingScriptView(chapter, ['zh', 'ja'], ['zh-Hant'])
  expect(derived.p[0].u[0]['zh-Hant']).toEqual([['漢語', 'hàn yǔ'], '。'])
  expect(derived.p[0].u[0].rich?.['zh-Hant']).toEqual([{ text: '動量' }, { math: 'p=mv' }])
  expect(derived.p[0].id).toBe(chapter.p[0].id)
  expect(derived.p[0].u[0].src).toBe(chapter.p[0].u[0].src)
  expect(chapter.p[0].u[0]['zh-Hant']).toBeUndefined()
  expect(readingScriptView(derived, ['zh', 'zh-Hant'], ['zh']).p[0].u[0].zh).toBe(chapter.p[0].u[0].zh)
  const missing = { ...derived, p: [{ ...derived.p[0], u: [{ src: 'edited', 'zh-Hant': ['專著'] }] }] }
  expect(readingScriptView(missing, ['zh-Hant', 'zh'], ['zh']).p[0].u[0].zh).toEqual(['专著'])
})

it('chooses chapter titles by interface and never uses unrelated ruby on derived text', () => {
  const row = { n: 1, file: 'c0001.json', bytes: 50, paras: 1, title: { en: 'Mechanics', zh: '经典力学' } }
  expect(chapterDisplayTitle(row, 'en', 'zh', chapter)).toMatchObject({ text: 'Mechanics', lang: 'en' })
  expect(chapterDisplayTitle(row, 'ja', 'zh', chapter)).toMatchObject({ text: '力学', line: [['力学', 'りきがく']] })
  expect(chapterDisplayTitle(row, 'zh-Hant', 'zh', chapter)).toMatchObject({ text: '經典力學', derived: true, line: undefined })
  expect(chapterDisplayTitle({ ...row, title: { wenyan: '舊題', 'zh-TW': '正式的標題' } }, 'zh-Hant', 'wenyan')).toMatchObject({ text: '正式的標題', derived: false })
})
