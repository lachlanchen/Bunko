import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowLeft, Cloud, RefreshCw } from 'lucide-react'
import { currentUser, restoreSession, sessionRevision, signIn, subscribeSession } from '../lib/discussions'
import { cloudCall, cloudPlatform, paymentURL, type CloudCatalog } from '../lib/cloudPlans'
import { useBackAction } from '../lib/backNavigation'
import type { UILanguage } from '../i18n'
import { cloudCopy } from './cloudCopy'
import './cloudPlans.css'

export function CloudPlans({ ui, onBack }: { ui: UILanguage; onBack: () => void }) {
  const user = useSyncExternalStore(subscribeSession, currentUser, () => null)
  useEffect(() => { void restoreSession().catch(() => {}) }, [])
  useBackAction(onBack, true, 50)
  return <CloudPlanAccount key={`${user?.id ?? 'guest'}:${sessionRevision()}`} ui={ui} onBack={onBack} />
}

function CloudPlanAccount({ ui, onBack }: { ui: UILanguage; onBack: () => void }) {
  const t = cloudCopy[ui], user = currentUser(), provider = cloudPlatform()
  const [catalog, setCatalog] = useState<CloudCatalog | null>(null)
  const [busy, setBusy] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const mounted = useRef(true), revision = useRef(sessionRevision()), cancelLogin = useRef<(() => void) | null>(null)
  const active = () => mounted.current && revision.current === sessionRevision()
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; cancelLogin.current?.() } }, [])
  useEffect(() => {
    let live = true
    void cloudCall<CloudCatalog>('catalog').then(value => { if (live) setCatalog(value) }).catch(() => { if (live) setError(t.error) })
    return () => { live = false }
  }, [t.error])
  async function refresh() {
    if (busy) return
    setBusy('refresh'); setError('')
    try { const value = await cloudCall<CloudCatalog>('catalog'); if (active()) setCatalog(value) }
    catch { if (active()) setError(t.error) }
    finally { if (active()) setBusy('') }
  }
  function login() {
    setBusy('login'); setError('')
    const flow = signIn(); cancelLogin.current = flow.cancel
    // beginSignIn advances the session revision before the identity is known.
    revision.current = sessionRevision()
    void flow.promise.catch(() => { if (active()) setError(t.error) }).finally(() => { if (active()) setBusy(''); cancelLogin.current = null })
  }
  async function web(action: 'checkout' | 'portal' | 'restore', plan?: string) {
    if (busy || !user || provider !== 'stripe') return
    setBusy(action); setError(''); setNotice('')
    try {
      const fresh = await cloudCall<CloudCatalog>('catalog')
      if (!active()) return
      setCatalog(fresh)
      if (!fresh.enabled || !fresh.providers.stripe || (action === 'checkout' && !fresh.newPurchaseEnabled)) return
      if (action === 'restore') {
        const value = await cloudCall<CloudCatalog>('restore')
        if (active()) { setCatalog(value); setNotice(t.restored) }
      } else {
        const result = await cloudCall<{ url: string }>(action, plan ? { plan } : {})
        if (active()) window.location.assign(paymentURL(result.url, action))
      }
    } catch { if (active()) setError(t.error) }
    finally { if (active()) setBusy('') }
  }
  const quota = catalog?.quota
  // Native purchases are added by the corresponding native store bridge. Never
  // route a native user into a web purchase or treat a planned price as live.
  const webReady = provider === 'stripe' && catalog?.enabled && catalog.providers.stripe
  const hasStripe = catalog?.subscriptions.some(item => item.platform === 'stripe')
  return <main className="cloud-page">
    <header><button type="button" onClick={onBack} aria-label={t.close}><ArrowLeft size={20} /></button><strong>{t.title}</strong><button type="button" onClick={() => void refresh()} disabled={!!busy} aria-label={t.retry}><RefreshCw size={18} /></button></header>
    <section className="cloud-intro"><Cloud size={32} /><h1>{t.title}</h1><p>{t.intro}</p><p className="cloud-included">{t.included}</p></section>
    {!user && <section className="cloud-account"><p>{t.signedOut}</p><button className="primary" type="button" onClick={login} disabled={!!busy}>{busy === 'login' ? t.signingIn : t.signIn}</button>{busy === 'login' && <button type="button" onClick={() => cancelLogin.current?.()}>{t.cancel}</button>}</section>}
    {quota?.enabled && <section className="cloud-usage"><h2>{t.usage}</h2>{quota.unlimited ? <p>{t.unlimited}</p> : <><div><strong>{quota.remainingPages.toLocaleString(ui)} <small>{t.pages} · {t.remaining}</small></strong><strong>{quota.remainingAgentTurns.toLocaleString(ui)} <small>{t.answers} · {t.remaining}</small></strong></div><p>{t.resets}: {new Date(quota.ends).toLocaleDateString(ui)}</p></>}</section>}
    {catalog && !webReady && <p className="cloud-status">{t.unavailable}</p>}
    {catalog?.hasBlockingPurchase && <p className="cloud-status">{t.blocked}</p>}
    <section className="cloud-grid" aria-label={t.title}>{catalog?.plans.map(plan => <article key={plan.id} className={quota?.plan === plan.id ? 'current' : ''}>
      <h2>{t[plan.id as 'reader' | 'researcher' | 'studio'] ?? plan.name}</h2>
      <p className="cloud-price"><small>{webReady ? t.monthly : t.planned}</small>US${plan.targetUSD}</p>
      <p><strong>{plan.pages.toLocaleString(ui)}</strong> {t.pages}</p><p><strong>{plan.agentTurns}</strong> {t.answers}</p>
      <button type="button" disabled={!webReady || !catalog.newPurchaseEnabled || !!busy} onClick={() => void web('checkout', plan.id)}>{quota?.plan === plan.id ? t.current : webReady ? t.subscribe : t.soon}</button>
    </article>)}</section>
    {catalog?.trialEligible && <p className="cloud-terms">{t.trial}</p>}
    {error && <p className="cloud-error" role="alert">{error} <button type="button" onClick={() => void refresh()} disabled={!!busy}>{t.retry}</button></p>}
    {notice && <p role="status">{notice}</p>}
    <section className="cloud-actions">
      {webReady && user && <button type="button" disabled={!!busy} onClick={() => void web('restore')}>{t.restore}</button>}
      {webReady && hasStripe && <button type="button" disabled={!!busy} onClick={() => void web('portal')}>{t.manage}</button>}
      {catalog?.subscriptions.some(item => item.platform === 'apple') && <a href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noopener noreferrer">{t.manage} · Apple</a>}
      {catalog?.subscriptions.some(item => item.platform === 'google') && <a href="https://play.google.com/store/account/subscriptions" target="_blank" rel="noopener noreferrer">{t.manage} · Google Play</a>}
    </section>
    <footer><p>{t.renewal}</p><a href="https://llm.lazying.art/bunko/privacy.html" target="_blank" rel="noopener noreferrer">{t.privacy}</a><a href="https://llm.lazying.art/bunko/terms.html" target="_blank" rel="noopener noreferrer">{t.terms}</a></footer>
  </main>
}
