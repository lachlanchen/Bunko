import { describe, expect, it } from 'vitest'
import { mobilePlatform } from './mobileStore'

describe('mobile store routing', () => {
  it('routes iPhone, iPad and Android browsers to their platform', () => {
    expect(mobilePlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'iPhone', 5)).toBe('ios')
    expect(mobilePlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5)).toBe('ios')
    expect(mobilePlatform('Mozilla/5.0 (Linux; Android 15; Pixel 9)', 'Linux armv8l', 5)).toBe('android')
  })

  it('leaves desktop browsers in the web reader', () => {
    expect(mobilePlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 0)).toBeNull()
    expect(mobilePlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32', 0)).toBeNull()
  })
})
