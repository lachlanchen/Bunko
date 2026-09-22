import { describe, expect, it } from 'vitest'
import { defaultLangsFor } from './settings'

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
