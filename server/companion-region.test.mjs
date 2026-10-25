import { test } from 'node:test'
import assert from 'node:assert/strict'
import { companionAvailability, mainlandNetwork, companionClientAddress, companionModelScope } from './companion-region.mjs'
test('storefront and device country restrict independently of UI language or other signals', () => {
  for (const value of [{storefront:'CHN'}, {deviceRegion:'CN'}, {storefront:'CHN',deviceRegion:'US'}, {storefront:'USA',deviceRegion:'CN'}]) assert.equal(companionAvailability(value,'8.8.8.8').reason,'mainland')
  for (const storefront of ['USA','HKG','MAC','TWN','JPN']) assert.equal(companionAvailability({platform:'macos',storefront,language:'zh-Hans'},'8.8.8.8').available,true)
  for (const platform of ['macos','ios']) assert.equal(companionAvailability({platform},'8.8.8.8').reason,'region_unknown')
})
test('CN IPv4, IPv6 and mapped addresses cannot be overridden with an allowed storefront', () => {
  for (const ip of ['114.114.114.114','223.5.5.5','240e::1','::ffff:114.114.114.114']) {
    assert.equal(mainlandNetwork(ip),true,ip)
    assert.equal(companionAvailability({platform:'macos',storefront:'USA'},ip).reason,'mainland')
  }
  for (const ip of ['8.8.8.8','1.1.1.1','2606:4700:4700::1111','127.0.0.1','::1','invalid','114.114.114.114, 8.8.8.8']) assert.equal(mainlandNetwork(ip),false,ip)
})
test('only the loopback ingress may supply the client address; arbitrary country headers are ignored', () => {
  assert.equal(companionClientAddress({socket:{remoteAddress:'114.114.114.114'},headers:{'x-bunko-client-address':'8.8.8.8'}}),'114.114.114.114')
  assert.equal(companionClientAddress({socket:{remoteAddress:'127.0.0.1'},headers:{'x-bunko-client-address':'114.114.114.114'}}),'114.114.114.114')
})

test('mainland and unknown native regions select DeepSeek without disabling the workspace', () => {
  for(const [region,ip] of [[{platform:'macos',storefront:'CHN'},'8.8.8.8'],[{platform:'ios'},'8.8.8.8'],[{platform:'web'},'223.5.5.5']]) assert.deepEqual(companionModelScope(region,ip),{deepseekOnly:true})
  assert.deepEqual(companionModelScope({platform:'macos',storefront:'HKG'},'1.1.1.1'),{deepseekOnly:false})
})
