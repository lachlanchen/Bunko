import type { Line, Unit } from '../types'

const aliases: Record<string, string> = { wenyan: 'zh-Hant', zh_modern: 'zh-Hans', ja_modern: 'ja' }
const reserved = new Set(['src', 'rich', 'annotation'])

/** Accept standard language/script/region tags without a fixed language list. */
export function isLanguageCode(value: unknown): value is string {
  return typeof value === 'string' && !reserved.has(value) &&
    (Object.hasOwn(aliases, value) || (value.length <= 63 && /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(value)))
}

export function htmlLanguage(lang: string): string {
  return Object.hasOwn(aliases, lang) ? aliases[lang] : isLanguageCode(lang) ? lang : 'und'
}

export function baseLanguage(lang: string): string {
  return htmlLanguage(lang).split('-')[0].toLowerCase()
}

const rtlScripts = new Set(['Arab', 'Hebr', 'Thaa', 'Nkoo', 'Adlm', 'Rohg', 'Syrc', 'Mand', 'Samr', 'Mend', 'Merc', 'Mero', 'Narb', 'Nbat', 'Palm', 'Phli', 'Phlp', 'Phnx', 'Prti', 'Sarb', 'Sogd', 'Sogo', 'Armi', 'Avst', 'Chrs', 'Elym', 'Hatr', 'Hung', 'Khar', 'Lydi', 'Mani', 'Orkh', 'Ougr', 'Yezi'])
export function languageDirection(lang: string): 'rtl' | 'ltr' | 'auto' {
  const tag = htmlLanguage(lang)
  // Explicit script takes precedence: ar-Latn is LTR, az-Arab is RTL.
  const explicit = tag.split('-').slice(1).find(part => /^[A-Za-z]{4}$/.test(part))
  let script = explicit ? explicit[0].toUpperCase() + explicit.slice(1).toLowerCase() : undefined
  try { script ??= new Intl.Locale(tag).maximize().script } catch { /* Older WebViews or private tags. */ }
  if (script) return rtlScripts.has(script) ? 'rtl' : 'ltr'
  if (['ar', 'he', 'fa', 'ur', 'ps', 'dv', 'yi', 'syr', 'ug'].includes(baseLanguage(tag))) return 'rtl'
  return 'auto'
}

export function unitLine(unit: Unit, lang: string): Line | undefined {
  const value = unit[lang]
  return isLanguageCode(lang) && Array.isArray(value) ? value as Line : undefined
}

export function unitLanguages(unit: Unit): string[] {
  return Object.keys(unit).filter(lang => !!unitLine(unit, lang)?.length)
}
