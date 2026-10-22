import type { BookRow, Place } from '../types'
import type { LibrarySort } from './settings'

const date = (value?: string) => {
  const time = value ? Date.parse(value) : NaN
  return Number.isFinite(time) ? time : 0
}
const readTime = (place?: Place) => typeof place?.lastReadAt === 'number' && Number.isFinite(place.lastReadAt) && place.lastReadAt > 0 ? place.lastReadAt : 0

/** Sort a copy; filtering and catalog refresh must never mutate shared data. */
export function orderBooks(books: BookRow[], sort: LibrarySort, places: Record<string, Place>, locale: string): BookRow[] {
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' })
  const title = (book: BookRow) => book.title[book.primary] || book.id
  return [...books].sort((a, b) => {
    let result = 0
    if (sort === 'recent') {
      result = readTime(places[b.id]) - readTime(places[a.id])
      // Old bookmarks have no timestamp. Keep them ahead of unread books,
      // without claiming an invented order among those legacy bookmarks.
      if (!result) result = Number(Boolean(places[b.id])) - Number(Boolean(places[a.id]))
    }
    if (sort === 'added' || (sort === 'recent' && !result)) result = date(b.addedAt) - date(a.addedAt)
    if (sort === 'author') result = collator.compare(a.author, b.author)
    return result || collator.compare(title(a), title(b)) || a.id.localeCompare(b.id)
  })
}
