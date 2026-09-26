import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { savedSession, saveSession } from './discussionStorage'

export const DISCUSSION_API = 'https://llm.lazying.art/bunko'
export interface DiscussionUser { id: number; login: string }
export interface DiscussionComment { id: number; body: string; user: DiscussionUser; html_url?: string; created_at?: string }
export interface DiscussionIssue extends DiscussionComment { number: number; locked: boolean }
export interface DiscussionThread { issue: DiscussionIssue | null; comments: DiscussionComment[]; nextPage: number | null }
interface Session { token?: string; user: DiscussionUser; expires: number }
let session: Session | null = null
let restoring: Promise<void> | null = null
let generation = 0
const subscribers = new Set<() => void>()
export const subscribeSession = (callback: () => void) => { subscribers.add(callback); return () => { subscribers.delete(callback) } }
export const currentUser = () => session?.user ?? null
function setSession(value: Session | null) { session = value; subscribers.forEach(callback => callback()) }
export class DiscussionError extends Error {
  code: string
  constructor(code: string) { super(code); this.code = code }
}
export function requestId() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
async function api<T>(path: string, data: object, signal?: AbortSignal, attempt = 0): Promise<T> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(abort, path === '/v1/discussions/post' ? 60000 : 30000)
  try {
    const response = await fetch(DISCUSSION_API + path, {
      method: 'POST', mode: 'cors', credentials: Capacitor.isNativePlatform() || window.__BUNKO_DESKTOP__ ? 'omit' : 'include', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-Bunko-Client': '1', ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) },
      body: JSON.stringify(data), signal: controller.signal,
    })
    const result = await response.json().catch(() => { throw new DiscussionError('temporarily_unavailable') })
    if (!response.ok) {
      if (response.status === 401) { setSession(null); void saveSession(null).catch(() => {}) }
      throw new DiscussionError(result.error ?? 'temporarily_unavailable')
    }
    return result as T
  } catch (error) {
    if (signal?.aborted) throw error
    const failure = error instanceof DiscussionError ? error : new DiscussionError('offline')
    // A repeated post uses the same requestId; the server returns its receipt or
    // refuses an ambiguous write. It never creates a second comment on retry.
    if (attempt < 1 && ['offline', 'temporarily_unavailable', 'github_unavailable'].includes(failure.code) && path !== '/v1/auth/start') {
      await new Promise(resolve => setTimeout(resolve, 800))
      return api<T>(path, data, signal, attempt + 1)
    }
    throw failure
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort) }
}
function signedOut() { try { return localStorage.getItem('bunko:signed-out') === '1' } catch { return false } }
function rememberSignOut(value: boolean) { try { if (value) localStorage.setItem('bunko:signed-out', '1'); else localStorage.removeItem('bunko:signed-out') } catch { /* No token is stored here. */ } }
export function restoreSession(): Promise<void> {
  if (restoring) return restoring
  const revision = generation
  restoring = (async () => {
    if (signedOut()) { await api('/v1/logout', {}).catch(() => {}); return }
    const token = await savedSession()
    if (generation !== revision) return
    if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) session = { token, user: { id: 0, login: '' }, expires: 0 }
    if (!token && (Capacitor.isNativePlatform() || window.__BUNKO_DESKTOP__)) return
    try {
      const result = await api<Omit<Session, 'token'>>('/v1/session', {})
      if (generation === revision) setSession({ ...result, ...(token ? { token } : {}) })
    } catch (error) {
      if (generation === revision) setSession(null)
      if (!(error instanceof DiscussionError && error.code === 'sign_in_again')) throw error
    }
  })().finally(() => { restoring = null })
  return restoring
}
export function readDiscussion(passage: string, page = 1, signal?: AbortSignal) {
  return api<DiscussionThread>('/v1/discussions/read', { passage, page }, signal)
}
export function postDiscussion(passage: string, excerpt: string, body: string, id: string) {
  return api<{ issue: DiscussionIssue; comment: DiscussionComment | null }>('/v1/discussions/post', { passage, excerpt: excerpt.slice(0, 500), body, requestId: id })
}
export async function signOut() {
  generation++; rememberSignOut(true)
  try { await api('/v1/logout', {}) } finally { setSession(null); await saveSession(null) }
}

// Native sessions use Keychain/Keystore; web sessions use an HttpOnly cookie.
// GitHub credentials and refresh tokens never leave the cloud service.
export function signIn() {
  generation++
  const revision = generation
  const native = Capacitor.isNativePlatform(), desktop = !!window.__BUNKO_DESKTOP__
  const popup = !native && !desktop ? window.open('about:blank', 'bunko-github', 'popup,width=520,height=700') : null
  if (popup) popup.opener = null
  const controller = new AbortController()
  let stop = false, browserClosed = false
  const cancel = () => { stop = true; controller.abort(); popup?.close(); if (native) void Browser.close().catch(() => {}); if (desktop) void window.webkit?.messageHandlers.bunkoAuth.postMessage({ cancel: true }) }
  const promise = (async () => {
    if (!native && !desktop && !popup) throw new DiscussionError('popup_blocked')
    const verifier = requestId()
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
    const challenge = btoa(String.fromCharCode(...digest)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const flow = await api<{ flow: string; url: string }>('/v1/auth/start', { challenge, platform: native || desktop ? 'native' : 'web', storage: native || desktop ? 'secure' : 'cookie' }, controller.signal)
    const url = new URL(flow.url)
    if (url.origin !== 'https://github.com' || url.pathname !== '/login/oauth/authorize') throw new DiscussionError('invalid_flow')
    let listener: Awaited<ReturnType<typeof App.addListener>> | undefined
    let finished: Awaited<ReturnType<typeof Browser.addListener>> | undefined
    try {
      if (native) {
        listener = await App.addListener('appUrlOpen', event => {
          try { const callback = new URL(event.url); if (callback.protocol === 'art.lazying.bunko:' && callback.host === 'oauth' && callback.pathname === '/complete' && callback.searchParams.get('flow') === flow.flow) void Browser.close().catch(() => {}) } catch { /* Ignore unrelated app links. */ }
        })
        finished = await Browser.addListener('browserFinished', () => { browserClosed = true })
        await Browser.open({ url: flow.url, toolbarColor: '#272942' })
      } else if (desktop) {
        const bridge = window.webkit?.messageHandlers.bunkoAuth
        if (!bridge) throw new DiscussionError('update_required')
        void bridge.postMessage({ url: flow.url }).catch(() => { browserClosed = true })
      } else if (popup) popup.location.href = flow.url
      const until = Date.now() + 10 * 60000
      while (!stop && Date.now() < until) {
        let result: Session | { pending: true }
        try { result = await api<Session | { pending: true }>('/v1/auth/complete', { flow: flow.flow, verifier }, controller.signal) }
        catch (error) {
          if (controller.signal.aborted) throw error
          if (!(error instanceof DiscussionError) || !['offline', 'temporarily_unavailable', 'rate_limited'].includes(error.code)) throw error
          result = { pending: true }
        }
        if ('user' in result) {
          if (stop || generation !== revision) throw new DiscussionError('authorization_cancelled')
          try { await saveSession(result.token ?? null) } catch { throw new DiscussionError('secure_storage_failed') }
          rememberSignOut(false); setSession(result); return result.user
        }
        // GitHub's COOP policy can make a live popup appear closed. Only an
        // explicit native browser cancellation or Bunko's Cancel ends the flow.
        if (browserClosed) throw new DiscussionError('authorization_cancelled')
        await new Promise<void>(resolve => { const done = () => { clearTimeout(timer); controller.signal.removeEventListener('abort', done); resolve() }; const timer = setTimeout(done, 3000); controller.signal.addEventListener('abort', done, { once: true }) })
      }
      throw new DiscussionError(stop ? 'authorization_cancelled' : 'flow_expired')
    } finally { await listener?.remove(); await finished?.remove() }
  })().finally(() => { popup?.close(); if (native) void Browser.close().catch(() => {}) })
  return { promise, cancel }
}
