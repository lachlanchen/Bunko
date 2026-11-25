import { chineseScript, convertChinese } from '../../server/title-locale.mjs'
import type { Chapter, Line, Token } from '../types'
import { unitLine } from './languages'
import { plainText } from './text'

const scripts = ['Hans', 'Hant'] as const
type Script = typeof scripts[number]

function chineseEditions(langs: string[]) {
  const published = new Map<Script, string>()
  for (const lang of langs) {
    const script = lang === 'wenyan' ? undefined : chineseScript(lang)
    if (script && (!published.has(script) || lang === `zh-${script}`)) published.set(script, lang)
  }
  return published
}

/** Preserve raw catalog language IDs so existing settings and references keep working. */
export function chineseReadingOptions(langs: string[]) {
  const published = chineseEditions(langs)
  if (!published.size && !langs.includes('wenyan')) return langs
  return [...langs, ...scripts.filter(script => !published.has(script)).map(script => `zh-${script}`)]
}

export function readingLanguage(lang: string, langs: string[]) {
  if (langs.includes(lang)) return lang
  const script = chineseScript(lang)
  return script && lang !== 'wenyan' ? chineseEditions(langs).get(script) ?? `zh-${script}` : lang
}

export function selectedReadingLanguages(selected: string[], langs: string[]) {
  const available = chineseReadingOptions(langs)
  return [...new Set(selected.map(lang => readingLanguage(lang, langs)))].filter(lang => available.includes(lang))
}

export function sourceReadingLanguage(lang: string, langs: string[]) {
  if (langs.includes(lang)) return lang
  const script = chineseScript(lang)
  if (!script) return undefined
  const published = chineseEditions(langs)
  return (published.get(script) ?? published.get(script === 'Hans' ? 'Hant' : 'Hans'))
    || (langs.includes('wenyan') ? 'wenyan' : undefined)
}

function convertLine(line: Line, script: Script): Line {
  const original = plainText(line)
  const converted = convertChinese(original, script)
  if (original === converted) return line
  // Convert the whole phrase first. Keep ruby only if token boundaries still agree.
  const tokens = line.map<Token>(token => {
    if (typeof token === 'string') return convertChinese(token, script)
    const [text, ...annotation] = token
    return [convertChinese(text, script), ...annotation] as Token
  })
  return converted === plainText(tokens) ? tokens : [converted]
}

/** An ephemeral reading/export view. Canonical chapters, hashes and passage IDs stay intact. */
export function readingScriptView(chapter: Chapter, available: string[], selected: string[]): Chapter {
  const published = chineseEditions(available)
  const conversions = selected.flatMap(lang => {
    const script = lang === 'wenyan' ? undefined : chineseScript(lang)
    if (!script) return []
    const source = published.get(script === 'Hans' ? 'Hant' : 'Hans')
      ?? (!published.size && available.includes('wenyan') ? 'wenyan' : undefined)
    return source ? [{ lang, source, script }] : []
  })
  if (!conversions.length) return chapter
  const title = { ...chapter.title }
  for (const {lang, source, script} of conversions) {
    const heading = title[source]
    if (!title[lang]?.length && heading?.length) title[lang] = convertLine(heading, script)
  }
  const p = chapter.p.map(paragraph => {
    let figure = paragraph.figure
    if (figure?.caption) {
      const caption = { ...figure.caption }
      for (const {lang, source, script} of conversions) {
        if (!caption[lang] && caption[source]) caption[lang] = convertChinese(caption[source], script)
      }
      figure = { ...figure, caption }
    }
    const u = paragraph.u.map(unit => {
      let next = unit
      for (const {lang, source, script} of conversions) {
        const line = unitLine(unit, source)
        const rich = unit.rich?.[source]
        if (unitLine(unit, lang)?.length || unit.rich?.[lang]?.length || !line?.length) continue
        next = { ...next, [lang]: convertLine(line, script) }
        if (rich) next.rich = { ...next.rich, [lang]: rich.map(part =>
          !part.math && part.text ? { ...part, text: convertChinese(part.text, script) } : part) }
      }
      return next
    })
    return { ...paragraph, figure, u }
  })
  return { ...chapter, title, p }
}
