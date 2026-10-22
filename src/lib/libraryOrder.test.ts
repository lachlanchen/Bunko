import { expect, it } from 'vitest'
import { orderBooks } from './libraryOrder'
import type { BookRow } from '../types'

const row = (id: string, addedAt?: string, author = ''): BookRow => ({ id, primary: 'en', title: { en: id }, author, addedAt, mode: 'plain', langs: ['en'], chapters: 1, paras: 1, bytes: 1, sha256: '' })
const books = [row('Alpha', '2026-10-01T00:00:00Z', 'Zed'), row('Book 10', '2026-10-03T00:00:00Z', 'Amy'), row('Book 2', '2026-10-02T00:00:00Z', 'Amy'), row('Old')]
const ids = (value: BookRow[]) => value.map(book => book.id)
it('puts the last reading visit first, then legacy bookmarks, then unread books', () => {
  expect(ids(orderBooks(books, 'recent', { Alpha: { chapter: 1, paragraph: 2, lastReadAt: 20 }, 'Book 2': { chapter: 0, paragraph: 0, lastReadAt: 30 }, Old: { chapter: 3, paragraph: 4 } }, 'en'))).toEqual(['Book 2', 'Alpha', 'Old', 'Book 10'])
  expect(ids(books)).toEqual(['Alpha', 'Book 10', 'Book 2', 'Old'])
})
it('sorts actual additions independently of reading and handles old undated catalogs', () => {
  expect(ids(orderBooks(books, 'added', { Old: { chapter: 0, paragraph: 0, lastReadAt: 99 } }, 'en'))).toEqual(['Book 10', 'Book 2', 'Alpha', 'Old'])
  expect(ids(orderBooks([row('Z', 'invalid'), row('A')], 'added', {}, 'en'))).toEqual(['A', 'Z'])
})
it('uses human title ordering and stable author/title ties after filtering', () => {
  expect(ids(orderBooks(books, 'title', {}, 'en'))).toEqual(['Alpha', 'Book 2', 'Book 10', 'Old'])
  expect(ids(orderBooks(books.filter(b => b.author === 'Amy'), 'author', {}, 'en'))).toEqual(['Book 2', 'Book 10'])
})
