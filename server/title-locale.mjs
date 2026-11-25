import { Converter } from 'opencc-js'

const aliases = { wenyan: 'zh-Hant', zh_modern: 'zh-Hans', ja_modern: 'ja' }
const tag = language => Object.hasOwn(aliases, language) ? aliases[language] : language
const base = language => tag(language).split('-')[0].toLowerCase()
export const chineseScript = language => {
  const parts = tag(language).toLowerCase().split('-')
  if (parts[0] !== 'zh') return undefined
  if (parts.includes('hans')) return 'Hans'
  if (parts.includes('hant') || parts.some(part => ['tw', 'hk', 'mo'].includes(part))) return 'Hant'
  return 'Hans'
}
const converters = new Map()
export function convertChinese(text, script) {
  if (!converters.has(script)) {
    converters.set(script, script === 'Hant' ? Converter({ from: 'cn', to: 't' }) : Converter({ from: 't', to: 'cn' }))
  }
  return converters.get(script)(text)
}

/** Prefer published titles, then derive the requested Chinese script from an existing Chinese title. */
export function localizedTitle(titles, ui, primary, fallback = '') {
  const rows = Object.entries(titles ?? {}).filter(([, value]) => typeof value === 'string' && value.trim())
  const exact = rows.find(([key]) => key.toLowerCase() === ui.toLowerCase())
  const local = rows.filter(([key]) => base(key) === base(ui))
  const wanted = chineseScript(ui)
  const published = exact ?? local.find(([key]) => wanted ? key !== 'wenyan' && chineseScript(key) === wanted : tag(key).toLowerCase() === ui.toLowerCase())
    ?? (wanted ? local.find(([key]) => chineseScript(key) === wanted) : local[0])
  if (published) return { key: published[0], text: published[1], lang: tag(published[0]), derived: false }
  if (wanted && local.length) {
    // Prefer a published modern title over literary Chinese when both can be converted.
    const [key, text] = local.find(([key]) => key !== 'wenyan') ?? local[0]
    return { key, text: convertChinese(text, wanted), lang: ui, derived: true }
  }
  const row = rows.find(([key]) => key === primary) ?? rows[0]
  return row ? { key: row[0], text: row[1], lang: tag(row[0]), derived: false } : { key: ui, text: fallback, lang: ui, derived: false }
}
