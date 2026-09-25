/**
 * The library: what is available, what is on this device, and how to get more.
 *
 * Everything the app reads comes from one public GitHub repository, so there is
 * no server of ours to keep alive and no account to hold. A book is fetched
 * once, stored in IndexedDB, and read from there forever after, which is what
 * makes the reader work on a plane.
 */
import type { BookMeta, BookRow, Chapter, ReaderIndex } from '../types'
import { cacheFigure, removeFigures } from './bookAssets'

const REPO = 'lachlanchen/bunko-books'
const BRANCH = 'main'

/**
 * Where the books come from, in the order they are tried.
 *
 * raw.githubusercontent leads because it serves the current commit within
 * seconds, while jsDelivr caches a branch reference for hours: publishing a
 * correction and watching readers keep the old file is worse than the extra
 * bandwidth. jsDelivr stays as the fallback, which also covers the networks
 * where raw.githubusercontent is unreachable.
 */
const ORIGINS = [
  `https://raw.githubusercontent.com/${REPO}/${BRANCH}`,
  `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}`,
]

const DB_NAME = 'bunko'
const DB_VERSION = 1
const STORE = 'files'

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null)
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
      request.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

const memory = new Map<string, unknown>()
const indexListeners = new Set<(index: ReaderIndex) => void>()

export function subscribeIndex(listener: (index: ReaderIndex) => void): () => void {
  indexListeners.add(listener)
  return () => { indexListeners.delete(listener) }
}

export function coverUrls(book: BookRow): string[] {
  // Catalog data cannot point the reader at arbitrary hosts or executable SVGs.
  if (!book.cover || !/^books\/[a-z0-9-]+\/cover-[a-f0-9]+\.(webp|png|jpg)$/.test(book.cover)) return []
  return ORIGINS.map((origin) => `${origin}/${book.cover}`)
}

function validIndex(value: ReaderIndex): ReaderIndex {
  if (value.schema !== 1 || !Array.isArray(value.books) || value.count !== value.books.length ||
      value.books.some((book) => !/^[a-z0-9-]+$/.test(book.id) || !Array.isArray(book.langs) || !book.langs.includes(book.primary))) {
    throw new Error('Unsupported or incomplete library catalog')
  }
  return value
}

async function storeIndex(index: ReaderIndex): Promise<void> {
  validIndex(index)
  await cachePut('index', index)
  for (const listener of indexListeners) listener(index)
}

async function cacheGet<T>(key: string): Promise<T | null> {
  if (memory.has(key)) return memory.get(key) as T
  const db = await openDb()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
      request.onsuccess = () => {
        const value = request.result as T | undefined
        if (value !== undefined) memory.set(key, value)
        resolve(value ?? null)
      }
      request.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function cachePut(key: string, value: unknown): Promise<void> {
  memory.set(key, value)
  const db = await openDb()
  if (!db) return
  await new Promise<void>((resolve) => {
    try {
      const transaction = db.transaction(STORE, 'readwrite')
      transaction.objectStore(STORE).put(value, key)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => resolve()
      transaction.onabort = () => resolve()
    } catch {
      resolve()
    }
  })
}

async function cacheDeletePrefix(prefix: string): Promise<void> {
  for (const key of [...memory.keys()]) if (key.startsWith(prefix)) memory.delete(key)
  const db = await openDb()
  if (!db) return
  await new Promise<void>((resolve) => {
    try {
      const transaction = db.transaction(STORE, 'readwrite')
      const store = transaction.objectStore(STORE)
      const request = store.openKeyCursor()
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) return
        if (String(cursor.key).startsWith(prefix)) store.delete(cursor.key)
        cursor.continue()
      }
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => resolve()
      transaction.onabort = () => resolve()
    } catch {
      resolve()
    }
  })
}

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let lastError: unknown = new Error('no origin tried')
  for (const origin of ORIGINS) {
    const controller = new AbortController()
    const abort = () => controller.abort()
    if (signal?.aborted) throw new Error('Download cancelled')
    signal?.addEventListener('abort', abort, { once: true })
    const timer = setTimeout(abort, 15000)
    try {
      const response = await fetch(`${origin}/${path}`, { signal: controller.signal, cache: path === 'reader-index.json' || path.endsWith('/meta.json') ? 'no-cache' : 'default' })
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
      return (await response.json()) as T
    } catch (error) {
      if (signal?.aborted) throw error
      lastError = error
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

/** The catalogue. Cached, but refreshed from the network whenever we are online. */
export async function loadIndex(options: { refresh?: boolean } = {}): Promise<ReaderIndex> {
  const cached = await cacheGet<ReaderIndex>('index')
  if (cached && !options.refresh) {
    void refreshIndexInBackground()
    return cached
  }
  try {
    const fresh = await fetchJson<ReaderIndex>('reader-index.json')
    await storeIndex(fresh)
    return fresh
  } catch (error) {
    if (cached) return cached
    throw error
  }
}

async function refreshIndexInBackground(): Promise<void> {
  try {
    const fresh = await fetchJson<ReaderIndex>('reader-index.json')
    await storeIndex(fresh)
  } catch {
    // Offline is normal here; the cached catalogue stays valid.
  }
}

export async function loadMeta(id: string, signal?: AbortSignal): Promise<BookMeta> {
  const index = await cacheGet<ReaderIndex>('index')
  const row = index?.books.find((book) => book.id === id)
  const key = `meta:${id}:${row?.sha256 ?? 'legacy'}`
  const cached = await cacheGet<BookMeta>(key)
  if (cached) return cached
  // Retain the last working edition when an updated catalog arrives before its
  // metadata, or when a 1.0.0 installation is upgraded while offline.
  const previous = await cacheGet<BookMeta>(`meta:${id}`)
  try {
    const meta = await fetchJson<BookMeta>(`books/${id}/meta.json`, signal)
    await cachePut(key, meta)
    await cachePut(`meta:${id}`, meta)
    return meta
  } catch (error) {
    if (previous && !signal?.aborted) return previous
    throw error
  }
}

/** Restore the downloaded shelf without fetching metadata for every book. */
export async function cachedBookCounts(books: BookRow[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const book of books) {
    const meta = await cacheGet<BookMeta>(`meta:${book.id}:${book.sha256}`) ?? await cacheGet<BookMeta>(`meta:${book.id}`)
    if (meta) counts[book.id] = await downloadedChapterCount(meta)
  }
  return counts
}

export async function loadChapter(id: string, file: string, signal?: AbortSignal): Promise<Chapter> {
  const key = `ch:${id}:${file}`
  const cached = await cacheGet<Chapter>(key)
  if (cached) return cached
  const chapter = await fetchJson<Chapter>(`books/${id}/${file}`, signal)
  await cachePut(key, chapter)
  return chapter
}

/** Is this chapter already on the device? */
export async function hasChapter(id: string, file: string): Promise<boolean> {
  return (await cacheGet(`ch:${id}:${file}`)) !== null
}

/** Download a whole book so it can be read with the network off. */
export async function downloadBook(
  id: string,
  onProgress: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const meta = await loadMeta(id, signal)
  let done = 0
  onProgress(0, meta.chapters.length)
  for (const chapter of meta.chapters) {
    if (signal?.aborted) throw new Error('Download cancelled')
    const loaded = await loadChapter(id, chapter.file, signal)
    for (const figure of loaded.p.map((paragraph) => paragraph.figure).filter((item) => item !== undefined)) {
      if (signal?.aborted) throw new Error('Download cancelled')
      await cacheFigure(id, figure.path)
    }
    done += 1
    onProgress(done, meta.chapters.length)
  }
}

export async function downloadedChapterCount(meta: BookMeta): Promise<number> {
  const flags = await Promise.all(meta.chapters.map((chapter) => hasChapter(meta.id, chapter.file)))
  return flags.filter(Boolean).length
}

/** Give the space back. The book stays in the catalogue and can be fetched again. */
export async function removeBook(id: string): Promise<void> {
  await removeFigures(id)
  await cacheDeletePrefix(`ch:${id}:`)
  await cacheDeletePrefix(`meta:${id}:`)
  // The original 1.0.0 reader used this exact legacy key. Including a trailing
  // separator above avoids deleting another book whose id shares this prefix.
  memory.delete(`meta:${id}`)
  const db = await openDb()
  if (db) {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(`meta:${id}`)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    })
  }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (!navigator.storage?.estimate) return null
    const { usage = 0, quota = 0 } = await navigator.storage.estimate()
    return { usage, quota }
  } catch {
    return null
  }
}

export const issueUrl = (title: string) =>
  `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(`Book request: ${title}`)}&body=${encodeURIComponent(
    'Which public-domain work would you like to read in Bunko?\n\nTitle:\n' + title + '\n\nAuthor:\n\nWhy this one:\n',
  )}`
