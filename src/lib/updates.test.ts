import { describe, expect, it } from 'vitest'
import { compareVersion, isSnoozed, nativeUpdate, SNOOZE_MS, STORE_URLS } from './updates'
import feed from '../../public/updates.json'

describe('public release updates', () => {
  it('compares versions numerically and normalizes missing components', () => {
    expect(compareVersion('1.10.0', '1.9.9')).toBe(1)
    expect(compareVersion('1.2', '1.2.0')).toBe(0)
    expect(compareVersion('1.0.4', '2.0.0')).toBe(-1)
    expect(() => compareVersion('1.2-beta', '1.2')).toThrow()
  })
  it('offers a newer public version or a newer build of the same version', () => {
    const release = { schema: 1, ios: { version: '1.1', build: '10' } }
    expect(nativeUpdate(release, 'ios', { version: '1.0', build: '99' })?.version).toBe('1.1')
    expect(nativeUpdate(release, 'ios', { version: '1.1', build: '9' })?.key).toBe('ios:1.1:10')
  })
  it('never downgrades newer TestFlight/internal versions or builds', () => {
    const release = { schema: 1, android: { version: '1.0.3', build: '5' } }
    expect(nativeUpdate(release, 'android', { version: '1.0.4', build: '6' })).toBeNull()
    expect(nativeUpdate(release, 'android', { version: '1.0.3', build: '6' })).toBeNull()
    expect(nativeUpdate(release, 'android', { version: '1.0.3', build: '5' })).toBeNull()
  })
  it('handles unpublished platforms and rejects broken feeds instead of claiming current', () => {
    expect(nativeUpdate({ schema: 1, macos: null }, 'macos', { version: '1.0.4', build: '6' })).toBeNull()
    for (const broken of [null, {}, { schema: 2 }, { schema: 1, ios: {} }, { schema: 1, ios: { version: 'bad', build: '6' } }]) {
      expect(() => nativeUpdate(broken, 'ios', { version: '1.0.4', build: '6' })).toThrow()
    }
  })
  it('uses only fixed platform store destinations', () => {
    expect(STORE_URLS.ios).toContain('apps.apple.com/app/id6815137919')
    expect(STORE_URLS.android).toContain('play.google.com/store/apps/details?id=art.lazying.bunko')
    for (const platform of ['ios', 'android', 'macos'] as const) expect(() => nativeUpdate(feed, platform, { version: '1.0.4', build: '6' })).not.toThrow()
  })
  it('snoozes only the offered release for one day, tolerating bad clocks and storage', () => {
    const now = SNOOZE_MS * 3, value = { key: 'ios:1.1:10', at: now - 100 }
    expect(isSnoozed(value, value.key, now)).toBe(true)
    expect(isSnoozed(value, 'ios:1.2:11', now)).toBe(false)
    expect(isSnoozed(value, value.key, now + SNOOZE_MS)).toBe(false)
    expect(isSnoozed({ ...value, at: now + 1 }, value.key, now)).toBe(false)
    expect(isSnoozed(null, value.key, now)).toBe(false)
  })
})
