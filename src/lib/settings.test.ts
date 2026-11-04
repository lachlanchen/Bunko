import { describe, expect, it } from 'vitest'
import { defaultLangsFor, DEFAULT_SETTINGS, normalizeSettings } from './settings'

describe('which languages a book opens with', () => {
  const trilingual = ['en', 'zh', 'ja'] as const
  const quadrilingual = ['wenyan', 'zh_modern', 'ja_modern', 'en'] as const

  it('always keeps the source language, and adds one gloss in the reader’s own language', () => {
    expect(defaultLangsFor([...trilingual], 'zh-Hans')).toEqual(['en', 'zh'])
    expect(defaultLangsFor([...trilingual], 'ja')).toEqual(['en', 'ja'])
    expect(defaultLangsFor([...quadrilingual], 'ja')).toEqual(['wenyan', 'ja_modern'])
    expect(defaultLangsFor([...quadrilingual], 'zh-Hant')).toEqual(['wenyan', 'zh_modern'])
  })

  it('shows the source alone when the reader already reads it', () => {
    expect(defaultLangsFor([...trilingual], 'en')).toEqual(['en'])
  })
})

it('preserves large book text independently of interface/ruby size and repairs corrupt saved settings', () => {
  expect(normalizeSettings({ ...DEFAULT_SETTINGS, fontScale:2.5, interfaceScale:1.3, rubyScale:.8 })).toMatchObject({fontScale:2.5,interfaceScale:1.3,rubyScale:.8})
  expect(normalizeSettings({ ...DEFAULT_SETTINGS, fontScale:Infinity, interfaceScale:-3, rubyScale:99, langs:['ja','en','ja'] })).toMatchObject({fontScale:1,interfaceScale:1,rubyScale:1.8,langs:['ja','en']})
  expect(normalizeSettings({ ...DEFAULT_SETTINGS, fontScale:4 })).toMatchObject({fontScale:2.5})
})
