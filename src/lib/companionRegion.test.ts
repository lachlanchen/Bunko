// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
const fixture = vi.hoisted(() => ({ platform: 'web', country: { storefront: 'USA', deviceRegion: 'US' }, fail: false, hang: false }))
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => fixture.platform }, registerPlugin: () => ({ current: async () => { if (fixture.fail) throw new Error('unavailable'); if (fixture.hang) await new Promise(() => {}); return fixture.country } }) }))
beforeEach(() => { fixture.platform='web'; fixture.country={storefront:'USA',deviceRegion:'US'}; fixture.fail=false; fixture.hang=false; window.__BUNKO_DESKTOP__=false })
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers() })
describe('companion request context', () => {
 it('keeps mainland and unknown storefronts usable and sends facts to the server without another request', async () => {
  fixture.platform='ios'; const fetcher=vi.fn(); vi.stubGlobal('fetch',fetcher)
  const { withCompanionRegion }=await import('./companionRegion')
  for(const country of [{storefront:'CHN',deviceRegion:'US'},{storefront:'USA',deviceRegion:'CN'},{storefront:'',deviceRegion:'US'}]) {
   fixture.country=country
   expect(await withCompanionRegion(async r=>r)).toEqual({platform:'ios',...country})
  }
  expect(fetcher).not.toHaveBeenCalled()
 })
 it('reads fresh Mac context without unmounting or cancelling an existing conversation', async () => {
  window.__BUNKO_DESKTOP__=true
  const bridge=vi.fn(async()=>fixture.country); window.webkit={messageHandlers:{bunkoAuth:{postMessage:bridge}}}
  const { withCompanionRegion }=await import('./companionRegion')
  let signal:AbortSignal|undefined, finish:()=>void=()=>{}
  const first=withCompanionRegion(async(_r,s)=>{signal=s;await new Promise<void>(resolve=>{finish=resolve});return 'saved answer'})
  await vi.waitFor(()=>expect(signal).toBeDefined())
  fixture.country={storefront:'CHN',deviceRegion:'CN'}; window.dispatchEvent(new Event('bunko-region-changed'))
  expect(await withCompanionRegion(async r=>r)).toEqual({platform:'macos',...fixture.country})
  expect(signal?.aborted).toBe(false); finish(); expect(await first).toBe('saved answer')
  expect(bridge).toHaveBeenCalledWith({region:true})
 })
 it('continues when StoreKit fails, with an explicit unknown native storefront', async () => {
  fixture.platform='ios'; fixture.fail=true
  const { withCompanionRegion }=await import('./companionRegion')
  expect(await withCompanionRegion(async r=>r)).toEqual({platform:'ios',storefront:'',deviceRegion:''})
 })
 it('bounds a stalled StoreKit lookup to one second', async () => {
  fixture.platform='ios'; fixture.hang=true; vi.useFakeTimers()
  const { withCompanionRegion }=await import('./companionRegion')
  const task=withCompanionRegion(async r=>r)
  await vi.advanceTimersByTimeAsync(1000)
  expect(await task).toEqual({platform:'ios',storefront:'',deviceRegion:''})
  expect(vi.getTimerCount()).toBe(0)
 })
})
