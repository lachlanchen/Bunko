import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { X } from 'lucide-react'
import type { UICopy } from '../i18n'
import { mobilePlatform, type MobilePlatform } from '../lib/mobileStore'
import { nativeUpdate, PUBLIC_RELEASES_URL, STORE_URLS } from '../lib/updates'

const APP_STORE_URL = 'https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919'
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=art.lazying.bunko'
// The release feed enables Play after its public listing has been verified.
function usePlayAvailability() {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    if (Capacitor.isNativePlatform() || window.__BUNKO_DESKTOP__) return
    let active = true
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    void fetch(PUBLIC_RELEASES_URL, { cache: 'no-store', credentials: 'omit', signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Release feed unavailable'); return response.json() })
      .then(feed => { if (active) setAvailable(!!nativeUpdate(feed, 'android', { version: '0', build: '0' })) })
      .catch(() => { /* Keep reading and known Apple links available offline. */ })
      .finally(() => clearTimeout(timer))
    return () => { active = false; clearTimeout(timer); controller.abort() }
  }, [])
  return available
}
const DISMISSED_KEY = 'bunko-mobile-store-prompt-dismissed-at'
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1000

function eligiblePlatform(): MobilePlatform | null {
  if (Capacitor.isNativePlatform() || window.__BUNKO_DESKTOP__) return null
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY))
    if (dismissedAt > 0 && dismissedAt <= Date.now() && Date.now() - dismissedAt < DISMISS_FOR_MS) return null
  } catch { /* Private browsing can block storage; the prompt remains dismissible. */ }
  return mobilePlatform(navigator.userAgent, navigator.platform, navigator.maxTouchPoints)
}

export function MobileStorePrompt({ copy }: { copy: UICopy }) {
  const playAvailable = usePlayAvailability()
  const [platform, setPlatform] = useState<MobilePlatform | null>(eligiblePlatform)
  if (!platform) return null

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())) } catch { /* Session dismissal still works. */ }
    setPlatform(null)
  }

  return (
    <aside className="mobile-store-prompt" aria-label={copy.mobileStoreTitle}>
      <div className="mobile-store-prompt-copy">
        <strong>{copy.mobileStoreTitle}</strong>
        <p>{platform === 'ios' ? copy.mobileStoreAppleBody : playAvailable ? copy.mobileStoreAndroidBody : copy.mobileStoreAndroidPending}</p>
      </div>
      <div className="mobile-store-prompt-actions">
        {platform === 'ios' && <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" onClick={dismiss}>{copy.mobileStoreAppleAction} ↗</a>}
        {platform === 'android' && playAvailable && <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" onClick={dismiss}>{copy.mobileStoreAndroidAction} ↗</a>}
        <button type="button" onClick={dismiss}>{copy.mobileStoreContinue}</button>
      </div>
      <button className="mobile-store-prompt-close" type="button" onClick={dismiss} aria-label={copy.close}>
        <X size={16} />
      </button>
    </aside>
  )
}

/** Always reachable in web/PWA Settings, even after the suggestion is dismissed. */
export function StoreLinks({ copy }: { copy: UICopy }) {
  const playAvailable = usePlayAvailability()
  if (Capacitor.isNativePlatform() || window.__BUNKO_DESKTOP__) return null
  return <section className="store-links" aria-label={copy.mobileStoreTitle}>
    <h3>{copy.mobileStoreTitle}</h3>
    <div className="update-actions">
      <a href={STORE_URLS.ios} target="_blank" rel="noopener noreferrer">{copy.mobileStoreAppleAction} · iPhone / iPad ↗</a>
      <a href={STORE_URLS.macos} target="_blank" rel="noopener noreferrer">{copy.mobileStoreAppleAction} · Mac ↗</a>
      {playAvailable && <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer">{copy.mobileStoreAndroidAction} ↗</a>}
    </div>
    {!playAvailable && <p className="hint">{copy.mobileStoreAndroidPending}</p>}
  </section>
}
