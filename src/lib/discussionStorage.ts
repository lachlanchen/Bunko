import { Capacitor } from '@capacitor/core'
import { KeychainAccess, SecureStorage } from '@aparajita/capacitor-secure-storage'

const key = 'bunko.discussion.session'
export async function savedSession(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const value = await SecureStorage.get(key, false, false)
    return typeof value === 'string' ? value : null
  }
  if (window.__BUNKO_DESKTOP__) {
    const value = await window.webkit?.messageHandlers.bunkoAuth.postMessage({ storage: 'read' })
    return typeof value === 'string' ? value : null
  }
  return null // Web sessions use an HttpOnly cookie, never localStorage.
}
export async function saveSession(token: string | null) {
  if (Capacitor.isNativePlatform()) {
    if (token) await SecureStorage.set(key, token, false, false, KeychainAccess.whenUnlockedThisDeviceOnly)
    else await SecureStorage.remove(key, false)
  } else if (window.__BUNKO_DESKTOP__) {
    const bridge = window.webkit?.messageHandlers.bunkoAuth
    if (!bridge) throw new Error('Secure storage unavailable')
    await bridge.postMessage({ storage: token ? 'save' : 'clear', ...(token ? { token } : {}) })
  }
}
