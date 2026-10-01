// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { copies } from '../i18n'
import { MobileStorePrompt, StoreLinks } from './MobileStorePrompt'

beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline'))))

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  delete window.__BUNKO_DESKTOP__
})

it('keeps store access available in an installed iPad PWA and after dismissal', () => {
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5, standalone: true })
  render(<><MobileStorePrompt copy={copies.en} /><StoreLinks copy={copies.en} /></>)
  fireEvent.click(screen.getByRole('button', { name: 'Keep reading here' }))
  const link = screen.getByRole('link', { name: /iPhone \/ iPad/ })
  expect(link.getAttribute('href')).toContain('6815137919')
  expect(link.getAttribute('target')).toBe('_blank')
})

it('offers Google Play after a verified public release enters the feed', async () => {
  phone('Mozilla/5.0 (Linux; Android 15)', 'Linux armv8l')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ schema: 1, android: { version: '1.0.9', build: '14' } }) }))
  render(<MobileStorePrompt copy={copies.en} />)
  const link = await screen.findByRole('link', { name: /Open Google Play/ })
  expect(link.getAttribute('href')).toBe('https://play.google.com/store/apps/details?id=art.lazying.bunko')
})

it('does not promote stores inside the native Mac app', () => {
  window.__BUNKO_DESKTOP__ = true
  phone('Mozilla/5.0 (iPhone)', 'iPhone')
  render(<><MobileStorePrompt copy={copies.en} /><StoreLinks copy={copies.en} /></>)
  expect(screen.queryByRole('link')).toBeNull()
  expect(fetch).not.toHaveBeenCalled()
})

function phone(userAgent: string, platform: string) {
  vi.stubGlobal('navigator', { userAgent, platform, maxTouchPoints: 5, standalone: false })
}

it('offers the live App Store listing to iPhone visitors and remembers dismissal', () => {
  phone('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'iPhone')
  const { unmount } = render(<MobileStorePrompt copy={copies.en} />)
  expect(screen.getByRole('link', { name: /Open App Store/ }).getAttribute('href')).toBe(
    'https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Keep reading here' }))
  expect(screen.queryByRole('complementary')).toBeNull()
  unmount()
  render(<MobileStorePrompt copy={copies.en} />)
  expect(screen.queryByRole('complementary')).toBeNull()
})

it('does not send Android visitors to an unpublished Play listing', () => {
  phone('Mozilla/5.0 (Linux; Android 15; Pixel 9)', 'Linux armv8l')
  render(<MobileStorePrompt copy={copies.en} />)
  expect(screen.getByText(/Android is in review/)).toBeTruthy()
  expect(screen.queryByRole('link')).toBeNull()
})
