// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
const fixture = vi.hoisted(() => ({ platform: 'web', country: { storefront: 'USA', deviceRegion: 'US' } }))
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => fixture.platform, isNativePlatform: () => fixture.platform === 'ios' }, registerPlugin: () => ({ current: async () => fixture.country }) }))
beforeEach(() => { vi.resetModules(); fixture.platform='web'; fixture.country={storefront:'USA',deviceRegion:'US'}; window.__BUNKO_DESKTOP__=false })
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })
const response = (available=true, reason='') => Response.json({companion:{available,reason,policy:'mainland-v1'}})
describe('companion regional availability', () => {
 it('blocks mainland Apple storefront or device region without sending a network request or invoking work', async () => {
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);fixture.platform='ios'
  const m=await import('./companionRegion')
  for(const country of [{storefront:'CHN',deviceRegion:'US'},{storefront:'USA',deviceRegion:'CN'}]) {
   fixture.country=country;const operation=vi.fn()
   expect((await m.refreshCompanionAvailability()).reason).toBe('mainland')
   await expect(m.withCompanionRegion(operation)).rejects.toThrow('companion_region_unavailable')
   expect(operation).not.toHaveBeenCalled()
  }
  expect(fetcher).not.toHaveBeenCalled()
 })
 it('keeps an unknown Apple storefront disabled instead of treating language as location', async () => {
  fixture.platform='ios';fixture.country={storefront:'',deviceRegion:'US'};const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher)
  const m=await import('./companionRegion');expect((await m.refreshCompanionAvailability()).reason).toBe('region_unknown');expect(fetcher).not.toHaveBeenCalled()
  expect(m.localRegionRestriction({platform:'ios',storefront:'HKG',deviceRegion:'HK'})).toBeNull()
 })
 it('checks the Mac native bridge and sends restrictive region facts to the server', async () => {
  window.__BUNKO_DESKTOP__=true;const bridge=vi.fn(async()=>({storefront:'USA',deviceRegion:'US'}));window.webkit={messageHandlers:{bunkoAuth:{postMessage:bridge}}}
  const fetcher=vi.fn<typeof fetch>(async()=>response());vi.stubGlobal('fetch',fetcher)
  const m=await import('./companionRegion');const operation=vi.fn(async r=>r)
  expect(await m.withCompanionRegion(operation)).toEqual({platform:'macos',storefront:'USA',deviceRegion:'US'})
  expect(bridge).toHaveBeenCalledWith({region:true});expect(JSON.parse(fetcher.mock.calls[0][1]!.body as string).clientRegion.storefront).toBe('USA')
 })
 it('honors server network restrictions and fails closed for unavailable or older policy responses', async () => {
  const m=await import('./companionRegion');vi.stubGlobal('fetch',vi.fn(async()=>response(false,'mainland')))
  expect((await m.refreshCompanionAvailability()).reason).toBe('mainland')
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({providers:['github']})))
  expect((await m.refreshCompanionAvailability()).available).toBe(false)
  vi.stubGlobal('fetch',vi.fn(async()=>{throw new Error('network')}))
  expect((await m.refreshCompanionAvailability()).reason).toBe('offline')
 })
 it('aborts active work on a region change and restores access without discarding saved data', async () => {
  fixture.platform='ios';vi.stubGlobal('fetch',vi.fn(async()=>response()));const m=await import('./companionRegion')
  localStorage.setItem('saved-reading','unchanged');let signal:AbortSignal|undefined,finish:()=>void=()=>{}
  const task=m.withCompanionRegion(async(_r,s)=>{signal=s;await new Promise<void>(resolve=>{finish=resolve});return 'done'})
  await vi.waitFor(()=>expect(signal).toBeDefined())
  fixture.country={storefront:'CHN',deviceRegion:'CN'};await m.refreshCompanionAvailability();expect(signal?.aborted).toBe(true);finish();await expect(task).rejects.toThrow('companion_region_unavailable')
  expect(localStorage.getItem('saved-reading')).toBe('unchanged')
  fixture.country={storefront:'JPN',deviceRegion:'JP'};expect((await m.refreshCompanionAvailability()).available).toBe(true)
 })
})
