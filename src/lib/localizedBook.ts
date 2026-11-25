import { localizedTitle } from '../../server/title-locale.mjs'
import type { BookMeta, BookRow, Chapter } from '../types'
import type { UILanguage } from '../i18n'
import { plainText } from './text'

export function bookDisplayTitle(book: BookMeta | BookRow, ui: UILanguage) {
  return localizedTitle('titleText' in book ? book.titleText : book.title, ui, book.primary, book.id)
}

export function chapterDisplayTitle(
  row: BookMeta['chapters'][number] | undefined, ui: UILanguage, primary: string,
  chapter?: Chapter | null, fallback = '',
) {
  const lines = chapter?.title ?? {}
  const titles = { ...row?.title }
  for (const [key, line] of Object.entries(lines)) {
    const text = plainText(line)
    if (text) titles[key] = text
  }
  const chosen = localizedTitle(titles, ui, primary, fallback)
  return { ...chosen, line: chosen.derived ? undefined : lines[chosen.key] }
}
