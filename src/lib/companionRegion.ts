import { Capacitor, registerPlugin } from '@capacitor/core'
import { useEffect, useSyncExternalStore } from 'react'
import { discussionOrigin } from './serviceOrigins'
export interface ClientRegion { platform: string; storefront: string; deviceRegion: string }
export interface CompanionAvailability { available: boolean; reason: 'checking' | 'mainland' | 'region_unknown' | 'offline' | ''; policy: string }
const nativeRegion = registerPlugin<{ current(): Promise<{ storefront: string; deviceRegion: string }> }>('BunkoRegion')
let state: CompanionAvailability = { available: false, reason: 'checking', policy: 'mainland-v1' }
let region: ClientRegion = { platform: 'web', storefront: '', deviceRegion: '' }
let pending: Promise<CompanionAvailability> | null = null
let generation = 0
const listeners = new Set<() => void>(), active = new Set<AbortController>()
const current = () => state
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }
function publish(next: CompanionAvailability) {
  if (JSON.stringify(state) === JSON.stringify(next)) return state
  state = next
  if (!state.available) for (const controller of active) controller.abort()
  listeners.forEach(fn => fn())
  return state
}
export function localRegionRestriction(value: ClientRegion): CompanionAvailability | null {
  if ([value.storefront, value.deviceRegion].some(v => /^(CN|CHN)$/i.test(v))) return { available: false, reason: 'mainland', policy: 'mainland-v1' }
  if (['macos', 'ios'].includes(value.platform) && !/^[A-Z]{3}$/.test(value.storefront)) return { available: false, reason: 'region_unknown', policy: 'mainland-v1' }
  return null
}
async function deviceRegion(): Promise<ClientRegion> {
  const platform = window.__BUNKO_DESKTOP__ ? 'macos' : Capacitor.getPlatform()
  if (platform === 'macos') {
    const data = await window.webkit?.messageHandlers.bunkoAuth.postMessage({ region: true }) as Partial<ClientRegion> | undefined
    return { platform, storefront: data?.storefront || '', deviceRegion: data?.deviceRegion || '' }
  }
  if (platform === 'ios') return { platform, ...await nativeRegion.current() }
  return { platform, storefront: '', deviceRegion: '' }
}
export function refreshCompanionAvailability(): Promise<CompanionAvailability> {
  if (pending) return pending
  const revision = generation
  pending = (async () => {
    try {
      // Native lookup is bounded even when the App Store is signed out/offline.
      let timer: ReturnType<typeof setTimeout> | undefined
      try { region = await Promise.race([deviceRegion(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('region_unknown')), 5000) })]) }
      finally { clearTimeout(timer) }
      if (revision !== generation) return state
      const restricted = localRegionRestriction(region)
      if (restricted) return publish(restricted)
      const response = await fetch(discussionOrigin(Capacitor.isNativePlatform() || !!window.__BUNKO_DESKTOP__) + '/v1/auth/methods', {
        method: 'POST', credentials: 'omit', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-Bunko-Client': '1' },
        body: JSON.stringify({ clientRegion: region }), signal: AbortSignal.timeout(8000),
      })
      const data = await response.json()
      if (!response.ok || data.companion?.policy !== 'mainland-v1' || typeof data.companion.available !== 'boolean') throw new Error('offline')
      return revision === generation ? publish(data.companion) : state
    } catch (error) { if (revision !== generation) return state; return publish({ available: false, reason: error instanceof Error && error.message === 'region_unknown' ? 'region_unknown' : 'offline', policy: 'mainland-v1' }) }
    finally { pending = null }
  })()
  return pending
}
export async function withCompanionRegion<T>(operation: (region: ClientRegion, signal: AbortSignal) => Promise<T>): Promise<T> {
  const availability = await refreshCompanionAvailability()
  if (!availability.available) throw new Error('companion_region_unavailable')
  const controller = new AbortController(); active.add(controller)
  try { const result = await operation({ ...region }, controller.signal); if (controller.signal.aborted) throw new Error('companion_region_unavailable'); return result } finally { active.delete(controller) }
}
export function useCompanionAvailability() {
  const value = useSyncExternalStore(subscribe, current, current)
  useEffect(() => {
    const refresh = () => { if (document.visibilityState !== 'hidden') void refreshCompanionAvailability() }
    const changed = () => { generation++; publish({ available: false, reason: 'checking', policy: 'mainland-v1' }); void (pending || Promise.resolve()).finally(refresh) }
    refresh(); window.addEventListener('focus', refresh); window.addEventListener('bunko-region-changed', changed); document.addEventListener('visibilitychange', refresh)
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('bunko-region-changed', changed); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  return value
}
