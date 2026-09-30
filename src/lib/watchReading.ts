import { unitLine } from './languages'
import { Capacitor, registerPlugin } from '@capacitor/core'
import type { BookMeta, Chapter, LangCode } from '../types'
import { plainText, tokenParts } from './text'

export interface WatchToken { text: string; ruby?: string }
export interface WatchLine { lang: LangCode; tokens: WatchToken[] }
export interface WatchSentence { lines: WatchLine[] }

export interface WatchReading {
  id: string
  title: string
  subtitle: string
  /** Plain fallback for older Watch installations. One aligned unit per block. */
  blocks: string[]
  sentences?: WatchSentence[]
  truncated: boolean
}

const watch = registerPlugin<{ save(options: { reading: string }): Promise<void> }>('BunkoWatch')
export const supportsWatch = () => Capacitor.getPlatform() === 'ios'

/** Transfer a small text excerpt; figures/math remain in the full phone edition. */
export function watchExcerpt(meta: BookMeta, chapter: Chapter, langs: LangCode[], start: number): WatchReading {
  const reading: WatchReading = {
    id: `${meta.id}/${chapter.n}/${start}`,
    title: (meta.titleText[meta.primary] ?? meta.id).slice(0, 150),
    subtitle: (plainText(chapter.title[langs[0]] ?? chapter.title[meta.primary]) || `Chapter ${chapter.n}`).slice(0, 150),
    blocks: [], sentences: [], truncated: false,
  }
  const available = chapter.p.slice(Math.max(0, start))
  const languages = [...new Set(langs)]
  excerpt: for (const paragraph of available) {
    // The Watch excerpt follows the main passage; optional translation notes
    // stay in the phone reader and must not become a second Japanese sentence.
    if (paragraph.kind === 'annotation' || (paragraph.id.endsWith('-notes') && paragraph.u.every(unit => unit.annotation === true))) continue
    // Equations and figures do not have a faithful plain-text Watch rendition.
    if (paragraph.figure || paragraph.kind === 'equation' || paragraph.u.some(unit => Object.values(unit.rich ?? {}).some(parts => parts?.some(part => part.math)))) {
      reading.truncated = true
      break
    }
    // Book units are already aligned across languages. Preserve that alignment
    // instead of concatenating an entire paragraph in each language first.
    for (const unit of paragraph.u) {
      const lines: WatchLine[] = languages.flatMap(lang => {
        const tokens = (unitLine(unit, lang) ?? []).map(token => {
          const { text, reading: ruby } = tokenParts(token)
          return ruby ? { text, ruby } : { text }
        }).filter(token => token.text)
        return tokens.length ? [{ lang, tokens }] : []
      })
      const text = lines.map(line => line.tokens.map(token => token.text).join('')).join('\n\n')
      if (!text.trim()) continue
      if (reading.blocks.length >= 24 || new TextEncoder().encode(text).length > 6000) {
        reading.truncated = true; break excerpt
      }
      reading.blocks.push(text)
      reading.sentences!.push({ lines })
      if (new TextEncoder().encode(JSON.stringify(reading)).length > 14500) {
        reading.blocks.pop(); reading.sentences!.pop()
        reading.truncated = true; break excerpt
      }
    }
  }
  return reading
}

export async function sendToWatch(reading: WatchReading): Promise<void> {
  if (!reading.blocks.length) throw new Error('This passage needs the full illustrated reader. Try a text passage.')
  await watch.save({ reading: JSON.stringify(reading) })
}
