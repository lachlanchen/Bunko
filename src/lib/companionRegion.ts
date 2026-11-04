import { Capacitor, registerPlugin } from '@capacitor/core'
export interface ClientRegion { platform: string; storefront: string; deviceRegion: string }
const nativeRegion = registerPlugin<{ current(): Promise<{ storefront: string; deviceRegion: string }> }>('BunkoRegion')
async function deviceRegion(platform: string): Promise<ClientRegion> {
  if (platform === 'macos') {
    const data = await window.webkit?.messageHandlers.bunkoAuth.postMessage({ region: true }) as Partial<ClientRegion> | undefined
    return { platform, storefront: data?.storefront || '', deviceRegion: data?.deviceRegion || '' }
  }
  if (platform === 'ios') return { platform, ...await nativeRegion.current() }
  return { platform, storefront: '', deviceRegion: '' }
}
export async function withCompanionRegion<T>(operation: (region: ClientRegion, signal: AbortSignal) => Promise<T>): Promise<T> {
  const platform = window.__BUNKO_DESKTOP__ ? 'macos' : Capacitor.getPlatform()
  const unknown: ClientRegion = { platform, storefront: '', deviceRegion: '' }
  let timer: ReturnType<typeof setTimeout> | undefined
  let region = unknown
  // Region selects the server's provider route; it never hides the workspace.
  // A signed-out or unavailable App Store uses the same DeepSeek-only route.
  try { region = await Promise.race([deviceRegion(platform), new Promise<ClientRegion>(resolve => { timer = setTimeout(() => resolve(unknown), 1000) })]) }
  catch { /* The server handles unknown native storefronts without blocking reading. */ }
  finally { clearTimeout(timer) }
  return operation(region, new AbortController().signal)
}
