/**
 * The library: what is available, what is on this device, and how to get more.
 *
 * Everything the app reads comes from one public GitHub repository, so there is
 * no server of ours to keep alive and no account to hold. A book is fetched
 * once, stored in IndexedDB, and read from there forever after, which is what
 * makes the reader work on a plane.
 */
import type { BookMeta, Chapter, ReaderIndex } from '../types'

const REPO = 'lachlanchen/bunko-books'
const BRANCH = 'main'

/** jsDelivr first: it is CORS-open, globally cached and free. raw is the fallback. */
const ORIGINS = [
  `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}`,
  `https://raw.githubusercontent.com/${REPO}/${BRANCH}`,
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
    } catch {
      resolve()
    }
  })
}

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let lastError: unknown = new Error('no origin tried')
  for (const origin of ORIGINS) {
    try {
      const response = await fetch(`${origin}/${path}`, { signal, cache: 'default' })
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
      return (await response.json()) as T
    } catch (error) {
      if (signal?.aborted) throw error
      lastError = error
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
    await cachePut('index', fresh)
    return fresh
  } catch (error) {
    if (cached) return cached
    throw error
  }
}

async function refreshIndexInBackground(): Promise<void> {
  try {
    const fresh = await fetchJson<ReaderIndex>('reader-index.json')
    await cachePut('index', fresh)
  } catch {
    // Offline is normal here; the cached catalogue stays valid.
  }
}

export async function loadMeta(id: string, signal?: AbortSignal): Promise<BookMeta> {
  const key = `meta:${id}`
  const cached = await cacheGet<BookMeta>(key)
  if (cached) return cached
  const meta = await fetchJson<BookMeta>(`books/${id}/meta.json`, signal)
  await cachePut(key, meta)
  return meta
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
    if (signal?.aborted) return
    await loadChapter(id, chapter.file, signal)
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
  await cacheDeletePrefix(`ch:${id}:`)
  await cacheDeletePrefix(`meta:${id}`)
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
