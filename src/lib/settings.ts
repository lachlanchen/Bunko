/**
 * Everything the reader chooses, and where they got to in each book.
 *
 * All of it stays on the device. Capacitor's Preferences plugin is used where
 * it exists (it maps to the native key store on a phone) and localStorage in a
 * browser, so the web and native builds behave the same.
 */
import { Preferences } from '@capacitor/preferences'
import type { LangCode, Place, ReadingSettings } from '../types'

const SETTINGS_KEY = 'bunko.settings.v1'
const PLACE_KEY = 'bunko.place.v1'
const UI_KEY = 'bunko.ui.v1'

export const DEFAULT_SETTINGS: ReadingSettings = {
  langs: [],
  layout: 'interlinear',
  ruby: true,
  grammar: false,
  fontScale: 1,
  theme: 'system',
  serif: true,
}

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const { value } = await Preferences.get({ key })
    if (!value) return fallback
    return { ...fallback, ...(JSON.parse(value) as object) } as T
  } catch {
    return fallback
  }
}

async function write(key: string, value: unknown): Promise<void> {
  try {
    await Preferences.set({ key, value: JSON.stringify(value) })
  } catch {
    // A private window with storage blocked: the session still works.
  }
}

export const loadSettings = () => read<ReadingSettings>(SETTINGS_KEY, DEFAULT_SETTINGS)
export const saveSettings = (settings: ReadingSettings) => write(SETTINGS_KEY, settings)

export async function loadPlaces(): Promise<Record<string, Place>> {
  try {
    const { value } = await Preferences.get({ key: PLACE_KEY })
    return value ? (JSON.parse(value) as Record<string, Place>) : {}
  } catch {
    return {}
  }
}

export async function savePlace(bookId: string, place: Place): Promise<Record<string, Place>> {
  const places = await loadPlaces()
  const next = { ...places, [bookId]: place }
  await write(PLACE_KEY, next)
  return next
}

export interface UIState {
  language: 'en' | 'zh-Hans' | 'zh-Hant' | 'ja'
}

/** Guess the interface language from the device before the reader ever picks one. */
export function detectUILanguage(): UIState['language'] {
  const tags = typeof navigator === 'undefined' ? [] : [navigator.language, ...(navigator.languages ?? [])]
  for (const tag of tags) {
    const lower = (tag || '').toLowerCase()
    if (lower.startsWith('ja')) return 'ja'
    if (lower.startsWith('zh')) {
      return /hant|tw|hk|mo/.test(lower) ? 'zh-Hant' : 'zh-Hans'
    }
  }
  return 'en'
}

export const loadUI = () => read<UIState>(UI_KEY, { language: detectUILanguage() })
export const saveUI = (state: UIState) => write(UI_KEY, state)

/**
 * Which languages to show when a book is opened for the first time.
 *
 * The source language is never optional, and one gloss in the reader's own
 * language is a better first impression than all four lines at once.
 */
export function defaultLangsFor(bookLangs: LangCode[], ui: UIState['language']): LangCode[] {
  const primary = bookLangs[0]
  const preference: LangCode[] =
    ui === 'ja' ? ['ja', 'ja_modern'] : ui === 'en' ? ['en'] : ['zh', 'zh_modern']
  const gloss = preference.find((lang) => bookLangs.includes(lang) && lang !== primary)
  return gloss ? [primary, gloss] : [primary]
}
