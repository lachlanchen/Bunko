// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { copies } from '../i18n'
import { MobileStorePrompt } from './MobileStorePrompt'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
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
