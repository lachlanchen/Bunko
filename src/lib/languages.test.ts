import { describe, expect, it } from 'vitest'
import { baseLanguage, htmlLanguage, isLanguageCode, languageDirection, unitLanguages } from './languages'
import { languageName } from '../i18n'
import { defaultLangsFor } from './settings'

describe('arbitrary book language layers', () => {
  it('accepts language, script and regional tags, while excluding unit metadata', () => {
    for (const tag of ['ar', 'he', 'fa', 'hi', 'el', 'fr-CA', 'zh-Hant', 'az-Arab', 'wenyan']) expect(isLanguageCode(tag)).toBe(true)
    for (const tag of ['src', 'rich', 'annotation', 'bad_tag', '<script>', '', 'a'.repeat(64)]) expect(isLanguageCode(tag)).toBe(false)
    expect(unitLanguages({ src: 'text', rich: {}, annotation: true, ar: ['نص'], 'fr-CA': ['Texte'] })).toEqual(['ar', 'fr-CA'])
  })
  it('preserves tags and resolves script direction independently for each line', () => {
    expect(htmlLanguage('fr-CA')).toBe('fr-CA')
    expect(htmlLanguage('ja_modern')).toBe('ja')
    expect(baseLanguage('zh-Hant')).toBe('zh')
    for (const tag of ['ar', 'fa', 'he', 'az-Arab', 'dv']) expect(languageDirection(tag)).toBe('rtl')
    for (const tag of ['ar-Latn', 'az-Latn', 'hi', 'el', 'zh-Hant']) expect(languageDirection(tag)).toBe('ltr')
    expect(languageName('ar', 'en')).toBe('Arabic')
    expect(languageName('fr-CA', 'en')).toContain('French')
    expect(defaultLangsFor(['ar', 'en-GB', 'zh-Hant'], 'en')).toEqual(['ar', 'en-GB'])
    expect(defaultLangsFor(['ar', 'en-GB', 'zh-Hant'], 'zh-Hant')).toEqual(['ar', 'zh-Hant'])
  })
})
