// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CloudPlans } from './CloudPlans'
import type { CloudCatalog } from '../lib/cloudPlans'

const state = vi.hoisted(() => ({ user: { id: 1, login: 'reader' } as { id: number; login: string } | null, revision: 1, listeners: new Set<() => void>(), call: vi.fn(), platform: 'stripe' }))
vi.mock('../lib/discussions', () => ({ currentUser: () => state.user, sessionRevision: () => state.revision, subscribeSession: (fn: () => void) => { state.listeners.add(fn); return () => state.listeners.delete(fn) }, restoreSession: async () => {}, signIn: vi.fn() }))
vi.mock('../lib/cloudPlans', async original => ({ ...await original<typeof import('../lib/cloudPlans')>(), cloudCall: state.call, cloudPlatform: () => state.platform }))
vi.mock('../lib/backNavigation', () => ({ useBackAction: () => {} }))
const catalog: CloudCatalog = {
  enabled: true, newPurchaseEnabled: true, hasBlockingPurchase: false, signInRequired: false, accountToken: 'binding', providers: { apple: true, google: true, stripe: true },
  plans: [{ id: 'reader', name: 'Reader', targetUSD: '2.99', pages: 200, agentTurns: 40, apple: 'art.lazying.bunko.reader.monthly', google: 'bunko_reader_monthly' }],
  trial: { days: 7, pages: 50, agentTurns: 10 }, trialEligible: true, quota: null, subscriptions: [],
}
beforeEach(() => { state.user = { id: 1, login: 'reader' }; state.revision++; state.platform = 'stripe'; state.call.mockReset(); state.call.mockResolvedValue(catalog) })
afterEach(() => cleanup())
it('refreshes server permission before starting checkout', async () => {
  render(<CloudPlans ui="en" onBack={() => {}} />)
  const button = await screen.findByRole('button', { name: 'Subscribe' })
  state.call.mockResolvedValue({ ...catalog, newPurchaseEnabled: false, hasBlockingPurchase: true })
  fireEvent.click(button)
  await waitFor(() => expect(button).toBeDisabled())
  expect(state.call.mock.calls.map(call => call[0])).toEqual(['catalog', 'catalog'])
  expect(screen.getByText(/already have a purchase/)).toBeInTheDocument()
})
it('does not use Stripe for native apps even when server web billing is ready', async () => {
  state.platform = 'apple'
  render(<CloudPlans ui="ja" onBack={() => {}} />)
  expect(await screen.findByRole('button', { name: '近日公開' })).toBeDisabled()
  expect(screen.queryByRole('button', { name: '登録' })).not.toBeInTheDocument()
})
it('discards an old-account restore after the account changes', async () => {
  let finish!: (value: CloudCatalog) => void
  state.call.mockImplementation((action: string) => action === 'restore' ? new Promise<CloudCatalog>(resolve => { finish = resolve }) : Promise.resolve(catalog))
  render(<CloudPlans ui="en" onBack={() => {}} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Restore purchases' }))
  await waitFor(() => expect(finish).toBeTypeOf('function'))
  state.call.mockResolvedValue({ ...catalog, enabled: false, newPurchaseEnabled: false })
  act(() => { state.user = { id: 2, login: 'second' }; state.revision++; state.listeners.forEach(fn => fn()) })
  await act(async () => finish({ ...catalog, hasBlockingPurchase: true }))
  expect(screen.queryByText('Your purchases are up to date.')).not.toBeInTheDocument()
  expect(screen.queryByText(/already have a purchase/)).not.toBeInTheDocument()
  expect(await screen.findByRole('button', { name: 'Coming soon' })).toBeDisabled()
})
