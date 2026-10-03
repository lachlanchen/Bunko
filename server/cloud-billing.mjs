import { createPurchaseVerifiers } from './cloud-providers.mjs'
import { createStripeBilling } from './cloud-stripe.mjs'
import { hash, requireValue } from './cloud-domain.mjs'

export function createCloudBilling(ledger, config = {}, { seal, unseal, verifiers = createPurchaseVerifiers({ billing: config }), poll = true } = {}) {
  const stripe = createStripeBilling(ledger, { billing: config, origin: 'https://lachlan.lazying.art/Bunko' })
  const ready = { ...verifiers.ready, stripe: stripe.ready }
  let stopped = false, running = false
  const requireReady = platform => requireValue(config.enabled === true && ready[platform] === true, 'Cloud subscriptions are not available yet.', 503)
  function persist(platform, source, proofs, requester) {
    requireValue(!stopped, 'Purchase verification is restarting. Please restore in a moment.', 503)
    return ledger.atomic(() => {
      let account
      for (const proof of proofs) {
        const bound = ledger.db.prepare('SELECT * FROM cloud_accounts WHERE token=?').get(proof.accountToken)
        if (!bound || (requester && bound.owner !== requester)) {
          if (proofs.length === 1) ledger.apply(proof, requester)
          continue
        }
        if (account && account.token !== bound.token) continue
        ledger.apply(proof, requester); account = bound
      }
      requireValue(account, 'Sign in with the Bunko account used for this purchase.', 409)
      if (!account.closed) {
        const id = hash(platform + ':' + (source.token || source.environment + ':' + source.transaction))
        const previous = ledger.db.prepare('SELECT * FROM cloud_sources WHERE id=?').get(id)
        requireValue(!previous || previous.owner === account.owner, 'Purchase ownership changed.', 409)
        const old = previous ? unseal(previous.body) : {}
        if (platform === 'google') source = { ...source, orders: [...new Set([...(old.orders || []), ...(source.orders || [])])].slice(-100) }
        else if (!Object.hasOwn(source, 'revision') && old.revision) source = { ...source, revision: old.revision }
        ledger.db.prepare('INSERT OR REPLACE INTO cloud_sources VALUES(?,?,?,?,?,0)').run(id, account.owner, platform, seal(source), Date.now() + 900000)
      }
      return { ok: true }
    })
  }
  async function google(token, requester, orders = []) {
    requireReady('google')
    const previous = typeof token === 'string' ? ledger.db.prepare('SELECT body FROM cloud_sources WHERE id=?').get(hash('google:' + token)) : null
    const prior = previous ? unseal(previous.body) : null
    const result = await verifiers.google(token, [...new Set([...orders, ...(prior?.orders || [])])], prior)
    const receipt = persist('google', result.source, result.proofs, requester)
    // Acknowledge only after durable delivery. Retry the same token on failure.
    await result.acknowledge(); return receipt
  }
  async function reconcile() {
    if (stopped || running || config.enabled !== true) return
    running = true
    try {
      for (const item of ledger.db.prepare('SELECT * FROM cloud_sources WHERE next<=? ORDER BY next LIMIT 20').all(Date.now())) {
        if (stopped) break
        if (!ledger.db.prepare('UPDATE cloud_sources SET next=? WHERE id=? AND next<=?').run(Date.now() + 900000, item.id, Date.now()).changes) continue
        try {
          const source = unseal(item.body)
          if (item.platform === 'google') await google(source.token, item.owner, source.orders)
          else {
            const result = item.platform === 'apple' ? await verifiers.appleHistory(source) : await stripe.verify(source.subscription)
            if (stopped) break
            if (result.proofs.length) persist(item.platform, result.source, result.proofs, item.owner)
            else ledger.db.prepare('UPDATE cloud_sources SET body=?,failures=0 WHERE id=?').run(seal(result.source), item.id)
            if (result.more) ledger.db.prepare('UPDATE cloud_sources SET next=0 WHERE id=?').run(item.id)
          }
        } catch {
          if (!stopped) ledger.db.prepare('UPDATE cloud_sources SET failures=failures+1,next=? WHERE id=?').run(Date.now() + Math.min(3600000, 60000 * 2 ** Math.min(item.failures, 6)), item.id)
        }
      }
    } finally { running = false }
  }
  const timer = config.enabled === true && poll ? setInterval(() => void reconcile(), 60000) : null
  timer?.unref()
  return {
    catalog: owner => ledger.catalog(owner, ready),
    async purchase(platform, input, owner) {
      requireValue(['apple', 'google'].includes(platform), 'Unknown purchase provider.')
      requireReady(platform); ledger.requireActive(owner)
      requireValue(ledger.enabled(owner), 'Cloud subscriptions are not available yet.', 503)
      if (platform === 'apple') {
        const proof = await verifiers.apple(input.signedTransaction)
        persist('apple', { transaction: proof.subscription, environment: proof.environment }, [proof], owner)
      } else await google(input.purchaseToken, owner)
      return ledger.catalog(owner, ready)
    },
    async web(action, input, owner) {
      requireValue(['checkout', 'portal', 'restore'].includes(action), 'Unknown web purchase action.')
      requireReady('stripe'); ledger.requireActive(owner)
      requireValue(ledger.enabled(owner), 'Cloud subscriptions are not available yet.', 503)
      if (action === 'restore') {
        for (const result of await stripe.restore({ id: owner })) persist('stripe', result.source, result.proofs, owner)
        return ledger.catalog(owner, ready)
      }
      return action === 'checkout' ? stripe.checkout({ id: owner }, input.plan) : stripe.portal({ id: owner })
    },
    async notification(platform, req, body, raw) {
      requireValue(['apple', 'google', 'stripe'].includes(platform), 'Unknown notification provider.')
      requireReady(platform)
      if (platform === 'stripe') {
        const result = await stripe.notification(req, raw)
        if (result) persist('stripe', result.source, result.proofs)
      } else if (platform === 'apple') {
        const proof = await verifiers.appleNotification(body.signedPayload)
        if (proof) persist('apple', { transaction: proof.subscription, environment: proof.environment }, [proof])
      } else {
        const source = await verifiers.googleNotification(req, body)
        if (source) await google(source.token, undefined, source.orders)
      }
      return { ok: true }
    },
    reconcile,
    stop() { stopped = true; if (timer) clearInterval(timer) },
  }
}
