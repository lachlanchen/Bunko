import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { X } from 'lucide-react'
import type { UICopy } from '../i18n'
import { mobilePlatform, type MobilePlatform } from '../lib/mobileStore'

const APP_STORE_URL = 'https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919'
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=art.lazying.bunko'
// The public Play listing returned 404 on 2026-09-25. Enable after release is visible without a tester account.
const GOOGLE_PLAY_PUBLIC = false
const DISMISSED_KEY = 'bunko-mobile-store-prompt-dismissed-at'
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1000

function eligiblePlatform(): MobilePlatform | null {
  if (Capacitor.isNativePlatform() || window.matchMedia?.('(display-mode: standalone)')?.matches) return null
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return null
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY))
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_FOR_MS) return null
  } catch { /* Private browsing can block storage; the prompt remains dismissible. */ }
  return mobilePlatform(navigator.userAgent, navigator.platform, navigator.maxTouchPoints)
}

export function MobileStorePrompt({ copy }: { copy: UICopy }) {
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
        <p>{platform === 'ios' ? copy.mobileStoreAppleBody : GOOGLE_PLAY_PUBLIC ? copy.mobileStoreAndroidBody : copy.mobileStoreAndroidPending}</p>
      </div>
      <div className="mobile-store-prompt-actions">
        {platform === 'ios' && <a href={APP_STORE_URL} onClick={dismiss}>{copy.mobileStoreAppleAction} ↗</a>}
        {platform === 'android' && GOOGLE_PLAY_PUBLIC && <a href={GOOGLE_PLAY_URL} onClick={dismiss}>{copy.mobileStoreAndroidAction} ↗</a>}
        <button type="button" onClick={dismiss}>{copy.mobileStoreContinue}</button>
      </div>
      <button className="mobile-store-prompt-close" type="button" onClick={dismiss} aria-label={copy.close}>
        <X size={16} />
      </button>
    </aside>
  )
}
