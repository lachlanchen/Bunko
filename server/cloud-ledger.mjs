import { randomUUID } from 'node:crypto'
import { hash, requireValue } from './cloud-domain.mjs'
import { plans, planForProduct, trialPolicy, freeQuota } from './cloud-plans.mjs'

export const cloudOwner = user => hash(`bunko-agent:${user.id}`)
export function createCloudLedger(db, config = {}, now = Date.now) {
  db.exec(`CREATE TABLE IF NOT EXISTS cloud_accounts(owner TEXT PRIMARY KEY,token TEXT UNIQUE NOT NULL,closed INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS cloud_receipts(id TEXT PRIMARY KEY,owner TEXT NOT NULL,subscription TEXT NOT NULL,platform TEXT NOT NULL,product TEXT NOT NULL,starts INTEGER NOT NULL,ends INTEGER NOT NULL,state TEXT NOT NULL,trial INTEGER NOT NULL,paid INTEGER NOT NULL,observed INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS cloud_period_owner ON cloud_receipts(owner,ends);
    CREATE TABLE IF NOT EXISTS cloud_subscriptions(id TEXT PRIMARY KEY,owner TEXT NOT NULL,platform TEXT NOT NULL,product TEXT NOT NULL,starts INTEGER NOT NULL,ends INTEGER NOT NULL,state TEXT NOT NULL,observed INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS cloud_trials(owner TEXT PRIMARY KEY,receipt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS cloud_usage(id TEXT PRIMARY KEY,owner TEXT NOT NULL,period TEXT NOT NULL,resource TEXT NOT NULL,units INTEGER NOT NULL,state TEXT NOT NULL,created INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS cloud_usage_owner ON cloud_usage(owner,period,resource);
    CREATE TABLE IF NOT EXISTS cloud_sources(id TEXT PRIMARY KEY,owner TEXT NOT NULL,platform TEXT NOT NULL,body TEXT NOT NULL,next INTEGER NOT NULL DEFAULT 0,failures INTEGER NOT NULL DEFAULT 0);`)
  let transaction = 0
  const atomic = fn => {
    const name = `cloud_${++transaction}`
    db.exec(`SAVEPOINT ${name}`)
    try {
      db.exec('UPDATE cloud_accounts SET closed=closed WHERE 0')
      const value = fn(); db.exec(`RELEASE ${name}`); return value
    } catch (error) { db.exec(`ROLLBACK TO ${name}; RELEASE ${name}`); throw error }
  }
  const requireActive = owner => requireValue(typeof owner === 'string' && /^[a-f0-9]{64}$/.test(owner) && !db.prepare('SELECT 1 FROM cloud_accounts WHERE owner=? AND closed=1').get(owner), 'This cloud account is unavailable.', 403)
  const enabled = owner => config.enabled === true && (!Array.isArray(config.accounts) || config.accounts.includes(owner))
  const unlimited = owner => Array.isArray(config.unlimitedAccounts) && config.unlimitedAccounts.includes(owner)
  function account(owner) {
    return atomic(() => {
      requireActive(owner)
      db.prepare('INSERT OR IGNORE INTO cloud_accounts(owner,token) VALUES(?,?)').run(owner, randomUUID())
      return db.prepare('SELECT token FROM cloud_accounts WHERE owner=?').get(owner).token
    })
  }
  const trialEligible = owner => !db.prepare('SELECT 1 FROM cloud_trials WHERE owner=?').get(owner) && !db.prepare('SELECT 1 FROM cloud_receipts WHERE owner=? AND paid=1').get(owner)
  const blocking = owner => !!db.prepare("SELECT 1 FROM cloud_subscriptions WHERE owner=? AND (state IN ('pending','paused') OR (state IN ('active','grace') AND ends>?))").get(owner, now())
  function period(owner) {
    const rows = db.prepare("SELECT r.* FROM cloud_receipts r JOIN cloud_subscriptions s ON s.id=r.subscription WHERE r.owner=? AND r.starts<=? AND r.ends>? AND r.state IN ('active','grace') AND s.state IN ('active','grace') AND s.ends>?").all(owner, now(), now(), now())
    const paid = rows.map(row => ({ ...row, plan: planForProduct(row.platform, row.product) })).filter(row => row.plan).sort((a, b) => (b.trial ? trialPolicy.pages : b.plan.pages) - (a.trial ? trialPolicy.pages : a.plan.pages) || b.starts - a.starts)[0]
    if (paid) return { ...paid, ...(paid.trial ? trialPolicy : paid.plan), plan: paid.plan.id, period: paid.id, trial: !!paid.trial }
    const date = new Date(now()), starts = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1), ends = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
    return { ...freeQuota, starts, ends, plan: null, trial: false, period: `free:${starts}` }
  }
  function usage(owner) {
    const current = period(owner), day = new Date(now()).toISOString().slice(0, 10)
    const used = (resource, key) => db.prepare("SELECT COALESCE(SUM(units),0) n FROM cloud_usage WHERE owner=? AND period=? AND resource=? AND state IN ('reserved','used','uncertain')").get(owner, key, resource).n
    const usedPages = used('pages', current.period), usedAgentTurns = used('answers', day)
    return { enabled: enabled(owner) && config.quotasEnabled === true, unlimited: unlimited(owner), plan: current.plan, trial: current.trial, starts: current.starts, ends: current.ends, pages: current.pages, agentTurns: current.agentTurns, usedPages, usedAgentTurns, remainingPages: Math.max(0, current.pages - usedPages), remainingAgentTurns: Math.max(0, current.agentTurns - usedAgentTurns) }
  }
  function reserve(owner, id, resource, units) {
    if (!enabled(owner) || config.quotasEnabled !== true || unlimited(owner)) return
    requireValue(['pages', 'answers'].includes(resource) && Number.isSafeInteger(units) && units > 0, 'Invalid cloud usage.')
    atomic(() => {
      requireActive(owner)
      const previous = db.prepare('SELECT * FROM cloud_usage WHERE id=?').get(id)
      if (previous) {
        requireValue(previous.owner === owner && previous.resource === resource && previous.units === units, 'Cloud request identifier was already used.', 409)
        if (previous.state !== 'released') return
      }
      const current = period(owner), available = usage(owner)
      requireValue(units <= (resource === 'pages' ? available.remainingPages : available.remainingAgentTurns), 'Your cloud allowance is used. Open Cloud plans to check usage and renewal. Books and offline reading remain available.', 402)
      db.prepare("INSERT OR REPLACE INTO cloud_usage VALUES(?,?,?,?,?,'reserved',?)").run(id, owner, resource === 'pages' ? current.period : new Date(now()).toISOString().slice(0, 10), resource, units, now())
    })
  }
  function finish(id, state) {
    requireValue(['used', 'uncertain', 'released'].includes(state), 'Invalid cloud usage state.')
    db.prepare("UPDATE cloud_usage SET state=? WHERE id=? AND state<>'used'").run(state, id)
  }
  function apply(proof, requester) {
    requireValue(['apple', 'google', 'stripe'].includes(proof.platform) && ['Sandbox', 'Production'].includes(proof.environment) && planForProduct(proof.platform, proof.product), 'Unknown Bunko cloud purchase.')
    requireValue(['active', 'grace', 'expired', 'revoked', 'pending', 'paused'].includes(proof.state) && ['receipt', 'subscription'].every(key => typeof proof[key] === 'string' && proof[key].length > 0 && proof[key].length < 300) && ['purchased', 'expires', 'observed'].every(key => Number.isSafeInteger(proof[key]) && proof[key] > 0) && typeof proof.paid === 'boolean' && typeof proof.revoked === 'boolean', 'Invalid verified purchase.')
    requireValue(proof.expires > proof.purchased && !(proof.paid && proof.trial), 'Invalid purchase period.')
    return atomic(() => {
      const bound = db.prepare('SELECT * FROM cloud_accounts WHERE token=?').get(proof.accountToken)
      requireValue(bound && (!requester || (bound.owner === requester && !bound.closed)), 'Sign in with the Bunko account used for this purchase.', 409)
      if (bound.closed) return { ignored: true }
      if (proof.environment === 'Sandbox') requireValue(config.allowSandbox === true && config.sandboxAccounts?.includes(bound.owner), 'Sandbox purchases are limited to test accounts.', 403)
      const owner = bound.owner, prefix = `${proof.platform}:${proof.environment}:`, id = hash(prefix + proof.receipt), subscription = hash(prefix + proof.subscription)
      const previous = db.prepare('SELECT * FROM cloud_receipts WHERE id=?').get(id), saved = db.prepare('SELECT * FROM cloud_subscriptions WHERE id=?').get(subscription)
      requireValue((!previous || (previous.owner === owner && previous.product === proof.product)) && (!saved || saved.owner === owner), 'Purchase ownership changed.', 409)
      const state = proof.revoked || previous?.state === 'revoked' ? 'revoked' : proof.state
      if (!saved || proof.purchased > saved.starts || (proof.purchased === saved.starts && proof.observed >= saved.observed)) db.prepare('INSERT OR REPLACE INTO cloud_subscriptions VALUES(?,?,?,?,?,?,?,?)').run(subscription, owner, proof.platform, proof.product, proof.purchased, proof.expires, state, proof.observed)
      if (previous?.observed > proof.observed && !proof.revoked) return { ignored: true }
      const trial = proof.trial === true
      if (trial) {
        requireValue(proof.expires > proof.purchased && proof.expires - proof.purchased <= 8 * 86400000, 'Invalid trial period.')
        const consumed = db.prepare('SELECT receipt FROM cloud_trials WHERE owner=?').get(owner)
        if (consumed && consumed.receipt !== id) return { ignored: true }
        db.prepare('INSERT OR IGNORE INTO cloud_trials VALUES(?,?)').run(owner, id)
      }
      // Pending states block another purchase but do not grant a usage period.
      if (proof.paid || trial || proof.revoked || previous) db.prepare('INSERT OR REPLACE INTO cloud_receipts VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id, owner, subscription, proof.platform, proof.product, proof.purchased, proof.expires, state, trial ? 1 : 0, proof.paid ? 1 : 0, proof.observed)
      return { owner, duplicate: !!previous }
    })
  }
  function catalog(owner, ready = {}) {
    if (owner) requireActive(owner)
    const active = !!owner && enabled(owner) && ['apple', 'google', 'stripe'].some(provider => ready[provider] === true)
    const quota = owner ? usage(owner) : null
    return { enabled: active, hasBlockingPurchase: !!owner && blocking(owner), newPurchaseEnabled: active && config.salesEnabled !== false && !blocking(owner), accountToken: active ? account(owner) : null, signInRequired: !owner, providers: Object.fromEntries(['apple','google','stripe'].map(provider => [provider, active && ready[provider] === true])), plans, trial: trialPolicy, trialEligible: !!owner && trialEligible(owner), quota, subscriptions: owner ? db.prepare('SELECT platform,product,ends AS expires,state FROM cloud_subscriptions WHERE owner=? ORDER BY ends DESC').all(owner) : [] }
  }
  return { db, atomic, account, requireActive, enabled, unlimited, trialEligible, blocking, period, usage, reserve, finish, apply, catalog }
}
