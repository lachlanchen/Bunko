import { Capacitor, registerPlugin } from '@capacitor/core'
import type { BookMeta, Chapter, LangCode } from '../types'
import { plainText } from './text'

export interface WatchReading {
  id: string
  title: string
  subtitle: string
  blocks: string[]
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
    blocks: [], truncated: false,
  }
  const available = chapter.p.slice(Math.max(0, start))
  for (const paragraph of available) {
    // Equations and figures do not have a faithful plain-text Watch rendition.
    if (paragraph.figure || paragraph.kind === 'equation' || paragraph.u.some(unit => Object.values(unit.rich ?? {}).some(parts => parts?.some(part => part.math)))) {
      reading.truncated = true
      break
    }
    const text = langs.map(lang => paragraph.u.map(unit => plainText(unit[lang])).filter(Boolean).join(' ')).filter(Boolean).join('\n\n').trim()
    if (!text) continue
    if (reading.blocks.length >= 24 || new TextEncoder().encode(text).length > 6000) { reading.truncated = true; break }
    reading.blocks.push(text)
    if (new TextEncoder().encode(JSON.stringify(reading)).length > 14500) {
      reading.blocks.pop(); reading.truncated = true; break
    }
  }
  return reading
}

export async function sendToWatch(reading: WatchReading): Promise<void> {
  if (!reading.blocks.length) throw new Error('This passage needs the full illustrated reader. Try a text passage.')
  await watch.save({ reading: JSON.stringify(reading) })
}
