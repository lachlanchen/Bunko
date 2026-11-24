import type { BookMeta, ReadingSettings } from '../types'

export const EPUB_TYPE = 'application/epub+zip'
export const EPUB_MAX_BYTES = 32 * 1024 * 1024
export const EPUB_MAIL_MAX_BYTES = 12 * 1024 * 1024
export function epubLanguages(book: BookMeta, settings: Pick<ReadingSettings, 'langs' | 'layout'>) {
  const shown = [...new Set(settings.langs)].filter(lang => book.langs.includes(lang))
  const langs = shown.length ? shown : [book.primary]
  return settings.layout === 'source' ? langs.slice(0, 1) : langs
}

