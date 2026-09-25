export type MobilePlatform = 'ios' | 'android'

export function mobilePlatform(userAgent: string, platform: string, maxTouchPoints: number): MobilePlatform | null {
  if (/android/i.test(userAgent)) return 'android'
  if (/iphone|ipad|ipod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)) return 'ios'
  return null
}
