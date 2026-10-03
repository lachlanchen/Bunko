import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHmac } from 'node:crypto'
import { createCloudLedger, cloudOwner } from './cloud-ledger.mjs'
import { createStripeBilling, stripeSignature } from './cloud-stripe.mjs'
import { plans } from './cloud-plans.mjs'

const owner = cloudOwner({ id: 7 })
function setup(t) {
  const directory = mkdtempSync(join(tmpdir(), 'bunko-billing-')), db = new DatabaseSync(':memory:')
  t.after(() => { db.close(); rmSync(directory, { recursive: true, force: true }) })
  writeFileSync(join(directory, 'key'), 'sk_test_fixture', { mode: 0o600 })
  writeFileSync(join(directory, 'hook'), 'whsec_fixture', { mode: 0o600 })
  const config = { origin: 'https://lachlan.lazying.art/Bunko', billing: { enabled: true, quotasEnabled: true, allowSandbox: true, sandboxAccounts: [owner],
    stripe: { keyFile: join(directory, 'key'), webhookSecretFile: join(directory, 'hook'), portalConfiguration: 'bpc_bunko', prices: { reader: 'price_reader', researcher: 'price_researcher', studio: 'price_studio' } } } }
  const ledger = createCloudLedger(db, config.billing)
  return { db, config, ledger }
}
const signature = raw => {
  const timestamp = Math.floor(Date.now() / 1000)
  return `t=${timestamp},v1=${createHmac('sha256', 'whsec_fixture').update(timestamp + '.').update(raw).digest('hex')}`
}
test('Stripe signatures bind the exact bytes and reject stale or forged notifications', () => {
  const raw = Buffer.from('{"app":"bunko"}')
  stripeSignature(raw, signature(raw), 'whsec_fixture')
  assert.throws(() => stripeSignature(Buffer.from('{}'), signature(raw), 'whsec_fixture'))
  assert.throws(() => stripeSignature(raw, signature(raw), 'whsec_fixture', Date.now() + 400000))
  assert.throws(() => stripeSignature(raw, signature(raw), 'another-secret'))
})

test('lost Checkout response is recovered with the same contract and expired after native purchase', async t => {
  const { db, config, ledger } = setup(t), requests = []
  let lose = true, expired = false
  const stripe = createStripeBilling(ledger, config, { transport: async (url, options) => {
    const path = new URL(url).pathname, values = Object.fromEntries(new URLSearchParams(options.body))
    if (path === '/v1/prices/price_reader') return Response.json({ id: 'price_reader', active: true, livemode: false, currency: 'usd', unit_amount: 299, recurring: { interval: 'month', interval_count: 1 } })
    if (path === '/v1/customers') return Response.json({ id: 'cus_reader' })
    if (path === '/v1/checkout/sessions') {
      requests.push({ values, key: options.headers['Idempotency-Key'] })
      if (lose) { lose = false; throw Error('lost response') }
      return Response.json({ id: 'cs_existing', url: 'https://checkout.stripe.com/c/pay/fixture', livemode: false })
    }
    if (path.endsWith('/expire')) { expired = true; return Response.json({ id: 'cs_existing', status: 'expired' }) }
    if (path === '/v1/checkout/sessions/cs_existing') return Response.json({ id: 'cs_existing', livemode: false, status: expired ? 'expired' : 'open' })
    throw Error('Unexpected fixture request')
  } })
  await assert.rejects(stripe.checkout({ id: owner }, 'reader'), /lost response/)
  ledger.apply({ platform: 'apple', environment: 'Sandbox', accountToken: ledger.account(owner), product: plans[0].apple,
    receipt: 'native-one', subscription: 'native-sub', purchased: Date.now(), expires: Date.now() + 86400000,
    observed: Date.now(), paid: true, revoked: false, state: 'active' }, owner)
  await assert.rejects(stripe.checkout({ id: owner }, 'reader'), /existing subscription/)
  assert.equal(expired, true); assert.equal(requests.length, 2)
  assert.deepEqual(requests[0], requests[1])
  assert.equal(requests[0].values['subscription_data[metadata][app]'], 'bunko')
  assert.equal(requests[0].values['subscription_data[trial_period_days]'], '7')
  assert.equal(requests[0].values.success_url, 'https://lachlan.lazying.art/Bunko/?billing=success')
  assert.equal(db.prepare('SELECT count(*) n FROM cloud_stripe_checkout').get().n, 1)
})

test('cash verification accepts one full-price payment and a refund revokes its allowance', async t => {
  const { config, ledger, db } = setup(t), token = ledger.account(owner)
  const start = Math.floor(Date.now() / 1000) - 10
  const price = { id: 'price_reader', active: true, livemode: false, currency: 'usd', unit_amount: 299, recurring: { interval: 'month', interval_count: 1 } }
  const subscription = { id: 'sub_reader', customer: 'cus_reader', livemode: false, metadata: { app: 'bunko', account_token: token }, status: 'active', items: { data: [{ quantity: 1, price }] } }
  const invoice = { id: 'in_paid', subscription: 'sub_reader', customer: 'cus_reader', livemode: false, status: 'paid', currency: 'usd', amount_paid: 299, amount_due: 299, amount_remaining: 0, subtotal: 299, total: 299, charge: 'ch_paid',
    lines: { data: [{ price: 'price_reader', currency: 'usd', amount: 299, subscription: 'sub_reader', quantity: 1, period: { start, end: start + 30 * 86400 } }] } }
  const charge = { id: 'ch_paid', invoice: 'in_paid', customer: 'cus_reader', livemode: false, currency: 'usd', paid: true, captured: true, status: 'succeeded', amount: 299, amount_captured: 299, amount_refunded: 0 }
  const stripe = createStripeBilling(ledger, config, { transport: async url => {
    const path = new URL(url).pathname
    return Response.json(path === '/v1/invoices' ? { data: [invoice] } : path === '/v1/charges/ch_paid' ? charge : subscription)
  } })
  db.prepare('INSERT INTO cloud_stripe_customers VALUES(?,?)').run(owner, 'cus_reader')
  const first = await stripe.verify('sub_reader')
  ledger.apply(first.proofs[0], owner)
  ledger.reserve(owner, 'converted-document', 'pages', 100); ledger.finish('converted-document', 'used')
  ledger.apply(first.proofs[0], owner)
  assert.equal(ledger.usage(owner).remainingPages, 100)
  for (const [key, value] of [['invoice', 'in_other'], ['customer', 'cus_other'], ['paid', false], ['captured', false], ['amount_captured', 1]]) {
    const original = charge[key]; charge[key] = value
    await assert.rejects(stripe.verify('sub_reader')); charge[key] = original
  }
  invoice.charge = null; await assert.rejects(stripe.verify('sub_reader')); invoice.charge = 'ch_paid'
  invoice.amount_paid = 199; await assert.rejects(stripe.verify('sub_reader')); invoice.amount_paid = 299
  charge.amount_refunded = 1
  const revoked = await stripe.verify('sub_reader'); ledger.apply(revoked.proofs[0], owner)
  assert.equal(ledger.usage(owner).plan, null)
  const unrelated = Buffer.from(JSON.stringify({ livemode: false, type: 'customer.subscription.updated', data: { object: { id: 'sub_other', metadata: { app: 'onlyideas' } } } }))
  assert.equal(await stripe.notification({ headers: { 'stripe-signature': signature(unrelated) } }, unrelated), null)
})

test('sales closure never contacts Stripe or creates a Checkout operation', async t => {
  const { ledger, config, db } = setup(t); config.billing.salesEnabled = false
  const stripe = createStripeBilling(ledger, config, { transport: async () => { assert.fail('No payment request is authorized') } })
  await assert.rejects(stripe.checkout({ id: owner }, 'reader'), /not available/)
  assert.equal(db.prepare('SELECT count(*) n FROM cloud_stripe_checkout').get().n, 0)
})
