import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { createCloudLedger, cloudOwner } from './cloud-ledger.mjs'
import { createCloudBilling } from './cloud-billing.mjs'
import { plans } from './cloud-plans.mjs'

const alice = cloudOwner({ id: 7 }), bob = cloudOwner({ id: 9 })
const start = Date.UTC(2026, 9, 3)
function setup(t, options = {}) {
  let time = start
  const db = new DatabaseSync(':memory:')
  const config = { enabled: true, quotasEnabled: true, allowSandbox: true, sandboxAccounts: [alice], ...options }
  const ledger = createCloudLedger(db, config, () => time)
  t.after(() => db.close())
  const token = ledger.account(alice)
  const proof = changes => ({ platform: 'apple', environment: 'Sandbox', accountToken: token,
    receipt: 'transaction-one', subscription: 'subscription-one', product: plans[0].apple,
    purchased: start, expires: start + 30 * 86400000, observed: start, paid: true,
    trial: false, revoked: false, state: 'active', ...changes })
  return { db, config, ledger, proof, advance: ms => { time += ms } }
}

test('cloud purchases are app-bound, account-bound and restricted to explicit sandbox accounts', t => {
  const { ledger, proof } = setup(t)
  assert.equal(ledger.account(alice), ledger.account(alice))
  assert.notEqual(ledger.account(alice), ledger.account(bob))
  assert.throws(() => ledger.apply(proof({ product: 'art.onlyideas.reader.monthly' }), alice), /Unknown/)
  assert.throws(() => ledger.apply(proof(), bob), /account used/)
  assert.throws(() => ledger.apply(proof({ accountToken: ledger.account(bob) }), bob), /test accounts/)
  assert.equal(ledger.usage(alice).plan, null)
  ledger.apply(proof(), alice)
  assert.equal(ledger.usage(alice).pages, 200)
  assert.equal(ledger.usage(bob).plan, null)
})

test('one paid period is granted once; replay and restored receipts cannot refill spent pages', t => {
  const { ledger, proof } = setup(t)
  ledger.apply(proof(), alice)
  ledger.reserve(alice, 'conversion-one', 'pages', 150)
  ledger.finish('conversion-one', 'used')
  ledger.apply(proof({ observed: start + 1000 }), alice)
  ledger.reserve(alice, 'conversion-one', 'pages', 150)
  assert.equal(ledger.usage(alice).remainingPages, 50)
  assert.throws(() => ledger.reserve(alice, 'conversion-two', 'pages', 51), /allowance/)
  assert.throws(() => ledger.reserve(bob, 'conversion-one', 'pages', 150), /identifier/)
  assert.throws(() => ledger.reserve(alice, 'conversion-one', 'pages', 1), /identifier/)
})

test('actual renewal opens a new page allowance while same-day AI usage remains counted', t => {
  const { ledger, proof, advance } = setup(t)
  ledger.apply(proof({ expires: start + 300000 }), alice)
  ledger.reserve(alice, 'pdf-first', 'pages', 200); ledger.finish('pdf-first', 'used')
  ledger.reserve(alice, 'answer-first', 'answers', 1); ledger.finish('answer-first', 'used')
  advance(300000)
  ledger.apply(proof({ receipt: 'renewal-two', purchased: start + 300000, expires: start + 600000, observed: start + 300000 }), alice)
  assert.equal(ledger.usage(alice).remainingPages, 200)
  assert.equal(ledger.usage(alice).remainingAgentTurns, 39)
})

test('unknown outcomes remain reserved and known pre-provider failures release allowance', t => {
  const { ledger } = setup(t)
  ledger.reserve(alice, 'uncertain', 'pages', 20)
  ledger.finish('uncertain', 'uncertain')
  assert.equal(ledger.usage(alice).remainingPages, 10)
  ledger.reserve(alice, 'before-provider', 'pages', 10)
  ledger.finish('before-provider', 'released')
  assert.equal(ledger.usage(alice).remainingPages, 10)
  ledger.finish('uncertain', 'used'); ledger.finish('uncertain', 'released')
  assert.equal(ledger.usage(alice).remainingPages, 10)
})

test('pending/paused payments prevent duplicate purchases without granting a paid plan', t => {
  for (const state of ['pending', 'paused']) {
    const { ledger, proof } = setup(t)
    ledger.apply(proof({ paid: false, state }), alice)
    const view = ledger.catalog(alice, { apple: true })
    assert.equal(view.hasBlockingPurchase, true)
    assert.equal(view.newPurchaseEnabled, false)
    assert.equal(view.quota.plan, null)
  }
})

test('revocation is sticky, stale active proof cannot restore it, new paid renewal remains independent', t => {
  const { ledger, proof, advance } = setup(t)
  ledger.apply(proof(), alice)
  ledger.apply(proof({ revoked: true, state: 'revoked', observed: start + 1000 }), alice)
  ledger.apply(proof({ observed: start + 2000 }), alice)
  assert.equal(ledger.usage(alice).plan, null)
  advance(30 * 86400000)
  ledger.apply(proof({ receipt: 'renewal', purchased: start + 30 * 86400000, expires: start + 60 * 86400000, observed: start + 30 * 86400000 }), alice)
  ledger.apply(proof({ revoked: true, state: 'revoked', observed: start + 31 * 86400000 }), alice)
  assert.equal(ledger.usage(alice).plan, 'reader')
})

test('one trial per Bunko identity and expired entitlement cannot authorize a second trial', t => {
  const { ledger, proof, advance } = setup(t)
  ledger.apply(proof({ trial: true, paid: false, expires: start + 7 * 86400000 }), alice)
  assert.equal(ledger.usage(alice).pages, 50)
  assert.equal(ledger.trialEligible(alice), false)
  advance(8 * 86400000)
  ledger.apply(proof({ receipt: 'second-trial', subscription: 'another-provider-subscription', trial: true, paid: false, purchased: start + 8 * 86400000, expires: start + 15 * 86400000, observed: start + 8 * 86400000 }), alice)
  assert.equal(ledger.usage(alice).plan, null)
  assert.equal(ledger.catalog(alice, { apple: true }).hasBlockingPurchase, true)
})

test('disabled sales still allow restore, while pilot isolation and quota bypass preserve ordinary reading', t => {
  const { ledger, proof } = setup(t, { accounts: [alice], salesEnabled: false })
  assert.equal(ledger.catalog(alice, { apple: true }).newPurchaseEnabled, false)
  ledger.apply(proof(), alice)
  assert.equal(ledger.catalog(alice, { apple: true }).quota.plan, 'reader')
  assert.equal(ledger.catalog(bob, { apple: true }).enabled, false)
  ledger.reserve(bob, 'existing-unmetered-cloud', 'pages', 10000)
  assert.equal(ledger.usage(bob).usedPages, 0)
  assert.equal(ledger.catalog(null, { apple: true }).signInRequired, true)
})

test('native empty restore cannot turn disabled sales into purchase authorization', async t => {
  const { ledger, config } = setup(t, { salesEnabled: false })
  const billing = createCloudBilling(ledger, config, { seal: JSON.stringify, unseal: JSON.parse, poll: false,
    verifiers: { ready: { apple: true, google: false } } })
  t.after(() => billing.stop())
  assert.equal(billing.catalog(alice).newPurchaseEnabled, false)
  await assert.rejects(billing.purchase('stripe', {}, alice), /Unknown/)
  await assert.rejects(billing.web('invalid-action', {}, alice), /Unknown/)
})

test('Google acknowledgement follows durable verification and encrypted source storage', async t => {
  const { ledger, config, proof, db } = setup(t)
  let acknowledgements = 0
  const billing = createCloudBilling(ledger, config, { seal: value => 'sealed:' + JSON.stringify(value), unseal: value => JSON.parse(value.slice(7)), poll: false,
    verifiers: { ready: { google: true }, google: async token => ({ source: { token, orders: ['order-one'] }, proofs: [proof({ platform: 'google', product: plans[0].google })], acknowledge: async () => { assert.equal(ledger.usage(alice).plan, 'reader'); acknowledgements++ } }) } })
  t.after(() => billing.stop())
  await assert.rejects(billing.purchase('google', { purchaseToken: 'fixture-only-token' }, bob), /account used/)
  assert.equal(acknowledgements, 0)
  await billing.purchase('google', { purchaseToken: 'fixture-only-token' }, alice)
  assert.equal(acknowledgements, 1)
  assert.ok(db.prepare('SELECT body FROM cloud_sources').get().body.startsWith('sealed:'))
})
