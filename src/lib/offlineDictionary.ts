import { gunzipSync } from 'fflate'
import { sha256 } from '@noble/hashes/sha2.js'
import type { Definition } from './readingTools'

export type DictionaryLanguage = 'en' | 'zh' | 'ja'
type WordRows = Record<string, [string, string, string][]>
interface Shard { file: string; bytes: number; sha256: string }
interface Pack { name: string; license: string; source: string; entries: number; bytes: number; files: Record<string, Shard> }
interface Manifest { schema: number; version: string; languages: Record<DictionaryLanguage, Pack> }
interface Installed { version: string; entries: number; bytes: number; source: string; name: string; license: string }

const ROOTS = [
  'https://raw.githubusercontent.com/lachlanchen/bunko-books/main/dictionaries',
  'https://cdn.jsdelivr.net/gh/lachlanchen/bunko-books@main/dictionaries',
]
const DB_NAME = 'bunko-dictionaries'
const STORE = 'packs'
let dbPromise: Promise<IDBDatabase> | null = null
const parsed = new Map<string, WordRows>()

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

async function get<T>(key: string): Promise<T | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null)
    request.onerror = () => reject(request.error)
  })
}

async function put(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function deletePrefix(prefix: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const cursor = store.openKeyCursor()
    cursor.onsuccess = () => {
      if (cursor.result) {
        if (String(cursor.result.key).startsWith(prefix)) store.delete(cursor.result.key)
        cursor.result.continue()
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function fetchFile(file: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  let lastError: unknown
  for (const root of ROOTS) {
    try {
      const response = await fetch(`${root}/${file}`, { signal })
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
      return response.arrayBuffer()
    } catch (error) {
      if (signal?.aborted) throw error
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Dictionary download failed')
}

async function manifest(signal?: AbortSignal): Promise<Manifest> {
  const bytes = await fetchFile('manifest.json', signal)
  const data = JSON.parse(new TextDecoder().decode(bytes)) as Manifest
  if (data.schema !== 1 || !data.languages?.en || !data.languages?.zh || !data.languages?.ja) throw new Error('Unsupported dictionary manifest')
  return data
}

function codeFor(word: string): string {
  return (sha256(new TextEncoder().encode(word))[0] >> 4).toString(16)
}

function verify(bytes: ArrayBuffer, expected: Shard): void {
  if (bytes.byteLength !== expected.bytes) throw new Error('Dictionary size mismatch')
  const digest = sha256(new Uint8Array(bytes))
  const actual = [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  if (actual !== expected.sha256) throw new Error('Dictionary checksum mismatch')
}

export async function installedDictionary(lang: DictionaryLanguage): Promise<Installed | null> {
  return get<Installed>(`installed:${lang}`)
}

export async function downloadDictionary(lang: DictionaryLanguage, onProgress: (done: number, total: number) => void, signal?: AbortSignal): Promise<Installed> {
  const latest = await manifest(signal)
  const pack = latest.languages[lang]
  const files = Object.entries(pack.files)
  const previous = await installedDictionary(lang)
  const prefix = `shard:${lang}:${latest.version}:`
  let done = 0
  onProgress(done, files.length)
  try {
    for (const [code, info] of files) {
      if (signal?.aborted) throw new DOMException('Download cancelled', 'AbortError')
      let bytes = await get<ArrayBuffer>(`${prefix}${code}`)
      if (!bytes) {
        bytes = await fetchFile(info.file, signal)
        verify(bytes, info)
        await put(`${prefix}${code}`, bytes)
      }
      done += 1
      onProgress(done, files.length)
    }
    const record = { version: latest.version, entries: pack.entries, bytes: pack.bytes, source: pack.source, name: pack.name, license: pack.license }
    await put(`installed:${lang}`, record)
    if (previous && previous.version !== latest.version) await deletePrefix(`shard:${lang}:${previous.version}:`)
    return record
  } catch (error) {
    if (!previous || previous.version !== latest.version) await deletePrefix(prefix)
    throw error
  }
}

export async function removeDictionary(lang: DictionaryLanguage): Promise<void> {
  await deletePrefix(`shard:${lang}:`)
  await deletePrefix(`installed:${lang}`)
  for (const key of parsed.keys()) if (key.startsWith(`${lang}:`)) parsed.delete(key)
}

export async function lookupOffline(word: string, lang: DictionaryLanguage): Promise<Definition[] | null> {
  const installed = await installedDictionary(lang)
  if (!installed) return null
  const clean = word.trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
  if (!clean) return []
  const keyWord = lang === 'en' ? clean.toLowerCase() : clean
  const code = codeFor(keyWord)
  const key = `${lang}:${installed.version}:${code}`
  let rows = parsed.get(key)
  if (!rows) {
    const bytes = await get<ArrayBuffer>(`shard:${lang}:${installed.version}:${code}`)
    if (!bytes) throw new Error('Dictionary pack incomplete')
    rows = JSON.parse(new TextDecoder().decode(gunzipSync(new Uint8Array(bytes)))) as WordRows
    if (parsed.size >= 4) parsed.delete(parsed.keys().next().value!)
    parsed.set(key, rows)
  }
  return (rows[keyWord] ?? []).map(([reading, partOfSpeech, meaning]) => ({ reading, partOfSpeech, meaning }))
}
