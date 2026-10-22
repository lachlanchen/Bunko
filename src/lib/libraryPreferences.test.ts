import { beforeEach, expect, it, vi } from 'vitest'
const values = vi.hoisted(() => new Map<string, string>())
vi.mock('@capacitor/preferences', () => ({ Preferences: {
  get: async ({ key }: { key: string }) => { await Promise.resolve(); return { value: values.get(key) ?? null } },
  set: async ({ key, value }: { key: string; value: string }) => { await Promise.resolve(); values.set(key, value) },
} }))
import { loadLibrarySort, saveLibrarySort, loadPlaces, savePlace, saveUI } from './settings'
beforeEach(() => values.clear())
it('persists sorting independently of language and validates unknown old values', async () => {
  expect(await loadLibrarySort()).toBe('recent')
  await saveLibrarySort('added'); await saveUI({ language: 'ja' })
  expect(await loadLibrarySort()).toBe('added')
  values.set('bunko.library.v1', '{"sort":"unknown"}')
  expect(await loadLibrarySort()).toBe('recent')
})
it('preserves legacy bookmarks and serializes concurrent visits to different books', async () => {
  values.set('bunko.place.v1', '{"legacy":{"chapter":4,"paragraph":6}}')
  await Promise.all([savePlace('one', { chapter: 1, paragraph: 2, lastReadAt: 100 }), savePlace('two', { chapter: 2, paragraph: 3, lastReadAt: 101 }), savePlace('one', { chapter: 1, paragraph: 9, lastReadAt: 102 })])
  expect(await loadPlaces()).toEqual({ legacy: { chapter: 4, paragraph: 6 }, one: { chapter: 1, paragraph: 9, lastReadAt: 102 }, two: { chapter: 2, paragraph: 3, lastReadAt: 101 } })
})
