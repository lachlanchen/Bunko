import { languageName, type UILanguage } from '../i18n'
import { htmlLanguage, isLanguageCode } from './languages'

export const translationLanguages = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'ar', 'es', 'fr', 'de', 'ru', 'vi']
const interfaces: UILanguage[] = ['en', 'zh-Hans', 'zh-Hant', 'ja']
const normalize = (value: string) => value.trim().normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ')

/** Match actual book layers; never equate different scripts or classical/modern Chinese. */
export function availableTranslation(layers: string[], requested: string): string | undefined {
  const input = normalize(requested)
  if (!input) return undefined
  const candidates = [...new Set([...translationLanguages, 'zh', ...layers])]
  let code = candidates.find(lang => normalize(lang) === input || interfaces.some(ui => normalize(languageName(lang, ui)) === input))
  if (!code) {
    // Also accept a native display name or a label such as “English (en)”.
    code = candidates.find(lang => {
      try { return normalize(new Intl.DisplayNames([htmlLanguage(lang)], { type: 'language' }).of(htmlLanguage(lang)) ?? '') === input } catch { return false }
    })
  }
  if (!code) {
    const tag = requested.trim().match(/\(([a-z]{2,8}(?:-[a-z0-9]{1,8})*)\)$/i)?.[1] ?? requested.trim()
    if (isLanguageCode(tag)) code = tag
  }
  if (!code) return undefined
  const exact = layers.find(lang => normalize(lang) === normalize(code!))
  if (exact) return exact
  if (code === 'wenyan') return undefined
  try {
    const target = new Intl.Locale(htmlLanguage(code)), expanded = target.maximize()
    return layers.find(lang => {
      if (lang === 'wenyan') return false
      try {
        const candidate = new Intl.Locale(htmlLanguage(lang)), full = candidate.maximize()
        return candidate.language === target.language && full.script === expanded.script &&
          (!target.region || candidate.region === target.region)
      } catch { return false }
    })
  } catch { return undefined }
}
