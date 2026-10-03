// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { api, readDiscussion, signOut } from './discussions'
afterEach(() => vi.unstubAllGlobals())
it('works without AbortSignal.timeout on macOS 12 and sends only the declared contract', async () => {
  const original = AbortSignal.timeout
  Object.defineProperty(AbortSignal, 'timeout', { configurable: true, value: undefined })
  const request = vi.fn<typeof fetch>(async () => Response.json({ issue: null, comments: [], nextPage: null }))
  vi.stubGlobal('fetch', request)
  try {
    expect(await readDiscussion('sample/c001.json/p1/2')).toEqual({ issue: null, comments: [], nextPage: null })
    expect(request.mock.calls[0][0]).toBe('https://llm.lazying.art/bunko/v1/discussions/read')
    const options = request.mock.calls[0][1] as RequestInit
    expect(options.credentials).toBe('include')
    expect(options.signal).toBeInstanceOf(AbortSignal)
    expect(options.body).toBe(JSON.stringify({ passage: 'sample/c001.json/p1/2', page: 1 }))
  } finally { Object.defineProperty(AbortSignal, 'timeout', { configurable: true, value: original }) }
})
it('does not retry a cloud purchase after an unknown response', async () => {
  const request = vi.fn<typeof fetch>(async () => { throw new TypeError('network lost') })
  vi.stubGlobal('fetch', request)
  await expect(api('/v1/cloud/checkout', { plan: 'reader' })).rejects.toThrow('offline')
  expect(request).toHaveBeenCalledTimes(1)
})
it('discards a delayed cloud response after sign-out', async () => {
  let finish!: (value: Response) => void
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async url => String(url).endsWith('/logout') ? Response.json({ ok: true }) : new Promise<Response>(resolve => { finish = resolve })))
  const pending = api('/v1/cloud/catalog', {})
  await signOut()
  finish(Response.json({ enabled: true, newPurchaseEnabled: true }))
  await expect(pending).rejects.toThrow('authorization_cancelled')
})
