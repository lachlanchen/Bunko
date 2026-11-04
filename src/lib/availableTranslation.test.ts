import { expect, it } from 'vitest'
import { availableTranslation } from './availableTranslation'

it('reuses a language for preset tags, names and labelled custom tags', () => {
  for (const input of ['en', ' EN ', 'English', '英文', '英語', 'English (en)']) expect(availableTranslation(['ja', 'en'], input)).toBe('en')
  expect(availableTranslation(['ja'], '日本語')).toBe('ja')
  expect(availableTranslation(['he'], 'עברית')).toBe('he')
  expect(availableTranslation(['fr-CA'], 'fr')).toBe('fr-CA')
  expect(availableTranslation(['en-GB'], 'en-US')).toBeUndefined()
})
it('keeps Chinese scripts and classical editions distinct', () => {
  expect(availableTranslation(['zh'], 'zh-Hans')).toBe('zh')
  expect(availableTranslation(['zh'], 'zh-Hant')).toBeUndefined()
  expect(availableTranslation(['zh-Hans', 'zh-Hant'], 'zh-Hant')).toBe('zh-Hant')
  expect(availableTranslation(['wenyan', 'zh_modern'], 'zh-Hans')).toBe('zh_modern')
  expect(availableTranslation(['wenyan'], 'zh-Hant')).toBeUndefined()
  expect(availableTranslation(['wenyan'], 'Classical Chinese')).toBe('wenyan')
  expect(availableTranslation(['ja_modern'], 'ja')).toBe('ja_modern')
})
it('leaves missing or unrecognized languages available for a new request', () => {
  for (const input of ['', 'fr', 'Martian', 'he', 'עברית']) expect(availableTranslation(['ja', 'en', 'zh'], input)).toBeUndefined()
  expect(availableTranslation(['az-Arab'], 'az-Latn')).toBeUndefined()
})
