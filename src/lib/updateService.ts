import { useEffect, useSyncExternalStore } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { isSnoozed, nativeUpdate, PUBLIC_RELEASES_URL, type UpdateCandidate, type UpdatePlatform } from './updates'

type UpdateState = {
  platform: UpdatePlatform
  version: string
  build?: string
  status: 'idle' | 'checking' | 'current' | 'error' | 'unsupported'
  candidate: UpdateCandidate | null
  snoozed: boolean
  applying: boolean
}
const SNOOZE_KEY = 'bunko.update-snooze.v1'
const CHECK_INTERVAL = 6 * 60 * 60 * 1000

async function json(url: string): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12_000)
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal, credentials: 'omit' })
    if (!response.ok) throw new Error('Update check failed')
    return await response.json()
  } finally { clearTimeout(timer) }
}

function waitForInstall(worker: ServiceWorker): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = (error?: Error) => {
      clearTimeout(timer); worker.removeEventListener('statechange', changed)
      if (error) reject(error); else resolve()
    }
    const changed = () => {
      if (worker.state === 'redundant') done(new Error('Update download failed'))
      else if (['installed', 'activating', 'activated'].includes(worker.state)) done()
    }
    const timer = setTimeout(() => done(new Error('Update download timed out')), 45_000)
    worker.addEventListener('statechange', changed)
    changed()
  })
}

/** One coordinator per app window: React remounts never duplicate registrations. */
class UpdateService {
  private state: UpdateState = { platform: 'web', version: __APP_VERSION__, status: 'idle', candidate: null, snoozed: false, applying: false }
  private listeners = new Set<() => void>()
  private started = false
  private initialized?: Promise<void>
  private registration?: ServiceWorkerRegistration
  private pending?: Promise<void>
  private checkedAt = 0
  private revision = 'web-update'
  private webVersion?: string
  private snooze: unknown
  private changedController = false
  private applyTimer?: ReturnType<typeof setTimeout>

  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  snapshot = () => this.state
  private set(patch: Partial<UpdateState>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((listener) => listener())
  }
  private offer(candidate: UpdateCandidate | null) {
    this.set({ candidate, snoozed: candidate ? isSnoozed(this.snooze, candidate.key) : false })
  }
  private offerWeb() {
    // A first installation briefly enters "waiting" before activation too.
    // Only an existing active worker makes that an upgrade.
    if ((this.registration?.waiting && this.registration.active) || this.changedController) this.offer({ key: this.revision, version: this.webVersion })
  }

  start = () => {
    if (this.started) return
    this.started = true
    try { this.snooze = JSON.parse(localStorage.getItem(SNOOZE_KEY) ?? 'null') } catch { /* Storage can be unavailable. */ }
    this.initialized = this.initialize()
    void this.check()
    const resume = () => { if (document.visibilityState !== 'hidden') void this.check() }
    window.addEventListener('online', () => { void this.check(true) })
    document.addEventListener('visibilitychange', resume)
    // Visible, long-running readers check at most once every six hours.
    window.setInterval(resume, CHECK_INTERVAL)
    if (Capacitor.isNativePlatform()) void App.addListener('appStateChange', ({ isActive }) => { if (isActive) void this.check() }).catch(() => {})
  }

  private async initialize() {
    if (window.__BUNKO_DESKTOP__) {
      this.set({ platform: 'macos', ...window.__BUNKO_APP_INFO__ })
    } else if (Capacitor.isNativePlatform()) {
      this.set({ platform: Capacitor.getPlatform() === 'ios' ? 'ios' : 'android' })
      try { const info = await App.getInfo(); this.set({ version: info.version, build: info.build }) } catch { /* No comparison without the installed build. */ }
    } else if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
      this.set({ status: 'unsupported' })
    } else {
      let controlled = !!navigator.serviceWorker.controller
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (this.state.applying) { clearTimeout(this.applyTimer); window.location.reload(); return }
        // Updating another open tab never reloads this reading session.
        if (controlled) { this.changedController = true; this.offerWeb() }
        controlled = true
      })
    }
  }

  check = (force = false): Promise<void> => {
    if (this.pending) return this.pending
    if (!force && Date.now() - this.checkedAt < CHECK_INTERVAL) {
      if (this.state.candidate) this.offer(this.state.candidate)
      return Promise.resolve()
    }
    this.pending = this.performCheck().finally(() => { this.pending = undefined })
    return this.pending
  }

  private async performCheck() {
    await this.initialized
    if (this.state.status === 'unsupported') return
    this.set({ status: 'checking' })
    try {
      if (!navigator.onLine) throw new Error('Offline')
      if (this.state.platform === 'web') {
        // Fetch the deployment identity outside the offline cache. This also
        // detects captive portals instead of reporting a false "up to date".
        const release = await json(new URL('web-release.json', document.baseURI).href)
        if (!release || typeof release !== 'object' || !('revision' in release) || typeof release.revision !== 'string' || !/^[a-f0-9]{64}$/.test(release.revision) || !('version' in release) || typeof release.version !== 'string') throw new Error('Invalid deployment')
        this.revision = `web:${release.revision}`
        this.webVersion = release.version
        if (!this.registration) {
          this.registration = await navigator.serviceWorker.register(new URL('sw.js', document.baseURI).href, { updateViaCache: 'none' })
          this.registration.addEventListener('updatefound', () => {
            const worker = this.registration?.installing
            if (worker) void waitForInstall(worker).then(() => this.offerWeb()).catch(() => this.set({ status: 'error' }))
          })
        }
        await this.registration.update()
        if (this.registration.installing) await waitForInstall(this.registration.installing)
        this.offerWeb()
      } else {
        if (!this.state.build) throw new Error('Missing installed version')
        const feed = await json(PUBLIC_RELEASES_URL)
        this.offer(nativeUpdate(feed, this.state.platform, { version: this.state.version, build: this.state.build }))
      }
      this.checkedAt = Date.now()
      this.set({ status: 'current' })
    } catch {
      // Retry after 15 minutes, immediately when requested. Offline use is unaffected.
      this.checkedAt = Date.now() - CHECK_INTERVAL + 15 * 60 * 1000
      this.set({ status: 'error' })
    }
  }

  dismiss = () => {
    if (!this.state.candidate) return
    this.snooze = { key: this.state.candidate.key, at: Date.now() }
    try { localStorage.setItem(SNOOZE_KEY, JSON.stringify(this.snooze)) } catch { /* Dismiss for this session. */ }
    this.set({ snoozed: true })
  }

  applyWeb = () => {
    if (this.state.platform !== 'web' || !this.state.candidate || this.state.applying) return
    if (this.changedController) { window.location.reload(); return }
    const waiting = this.registration?.waiting
    if (!waiting) { this.set({ status: 'error' }); return }
    this.set({ applying: true })
    this.applyTimer = setTimeout(() => this.set({ applying: false, status: 'error' }), 15_000)
    waiting.postMessage({ type: 'SKIP_WAITING' })
  }
}

const service = new UpdateService()
export function useUpdates() {
  const state = useSyncExternalStore(service.subscribe, service.snapshot)
  useEffect(() => { service.start() }, [])
  return { ...state, check: service.check, dismiss: service.dismiss, applyWeb: service.applyWeb }
}
export type Updates = ReturnType<typeof useUpdates>
