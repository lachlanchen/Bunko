/// <reference types="node" />
// @vitest-environment jsdom
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ native: false, saved: null as string | null }))
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => state.native } }))
vi.mock('./discussionStorage', () => ({ savedSession: async () => state.saved, saveSession: async (token: string | null) => { state.saved = token } }))
beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); localStorage.clear(); state.native = false; state.saved = null; vi.stubGlobal('crypto', webcrypto) })
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
it('recovers a lost completion response and ignores the COOP closed-popup signal', async () => {
  const popup = { opener: window, closed: true, location: { href: '' }, close: vi.fn() }
  vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
  let completions = 0
  const request = vi.fn<typeof fetch>(async url => {
    if (String(url).endsWith('/auth/start')) return Response.json({ flow: 'f'.repeat(43), url: 'https://github.com/login/oauth/authorize?client_id=fixture' })
    completions++
    if (completions === 1) throw new TypeError('network response lost')
    if (completions === 2) return Response.json({ pending: true })
    return Response.json({ user: { id: 1, login: 'reader' }, expires: Date.now() + 86400000 })
  })
  vi.stubGlobal('fetch', request)
  const api = await import('./discussions')
  const flow = api.signIn()
  // webcrypto completion and the transport-retry timer both run asynchronously.
  await vi.waitFor(() => expect(completions).toBeGreaterThan(0))
  await vi.advanceTimersByTimeAsync(4000)
  expect(await flow.promise).toEqual({ id: 1, login: 'reader' })
  expect(api.currentUser()?.login).toBe('reader')
  expect(state.saved).toBeNull()
  expect(localStorage.length).toBe(0)
  expect(request.mock.calls.every(([, init]) => init?.credentials === 'include')).toBe(true)
})
it('restores a native session after module restart and deletes it on sign-out', async () => {
  state.native = true; state.saved = 's'.repeat(43)
  const request = vi.fn<typeof fetch>(async url => Response.json(String(url).endsWith('/logout') ? { ok: true } : { user: { id: 2, login: 'native-reader' }, expires: Date.now() + 86400000 }))
  vi.stubGlobal('fetch', request)
  let api = await import('./discussions')
  await api.restoreSession()
  expect(api.currentUser()?.login).toBe('native-reader')
  expect(request.mock.calls[0][1]?.headers).toMatchObject({ Authorization: `Bearer ${'s'.repeat(43)}` })
  expect(request.mock.calls[0][1]?.credentials).toBe('omit')
  vi.resetModules(); api = await import('./discussions')
  await api.restoreSession()
  expect(api.currentUser()?.login).toBe('native-reader')
  await api.signOut()
  expect(state.saved).toBeNull(); expect(api.currentUser()).toBeNull()
  vi.resetModules(); api = await import('./discussions')
  await api.restoreSession()
  expect(api.currentUser()).toBeNull()
})
it('restores the web cookie without putting a credential in browser storage', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ user: { id: 3, login: 'web-reader' }, expires: Date.now() + 86400000 })))
  const api = await import('./discussions')
  await api.restoreSession()
  expect(api.currentUser()?.login).toBe('web-reader')
  expect(localStorage.length).toBe(0); expect(state.saved).toBeNull()
})
