import { Capacitor } from '@capacitor/core'
import { api } from './discussions'

export type CloudProvider = 'apple' | 'google' | 'stripe'
export interface CloudPlan { id: string; name: string; targetUSD: string; pages: number; agentTurns: number; apple: string; google: string }
export interface CloudCatalog {
  enabled: boolean; newPurchaseEnabled: boolean; hasBlockingPurchase: boolean; signInRequired: boolean
  accountToken: string | null; providers: Record<CloudProvider, boolean>; plans: CloudPlan[]
  trial: { days: number; pages: number; agentTurns: number }; trialEligible: boolean
  quota: null | { enabled: boolean; unlimited: boolean; plan: string | null; trial: boolean; ends: number; remainingPages: number; remainingAgentTurns: number }
  subscriptions: { platform: CloudProvider; product: string; expires: number; state: string }[]
}
export const cloudCall = <T>(action: 'catalog' | 'checkout' | 'portal' | 'restore' | 'purchase', input: object = {}) => api<T>(`/v1/cloud/${action}`, input)
export function cloudPlatform(): CloudProvider {
  return window.__BUNKO_DESKTOP__ || Capacitor.getPlatform() === 'ios' ? 'apple' : Capacitor.getPlatform() === 'android' ? 'google' : 'stripe'
}
export function paymentURL(value: string, action: 'checkout' | 'portal') {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.hostname !== (action === 'checkout' ? 'checkout.stripe.com' : 'billing.stripe.com')) throw new Error('Invalid payment destination')
  return url.href
}
