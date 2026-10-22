import { SignInOptions } from './SignInOptions'
import type { SignInProvider } from '../lib/discussions'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowDown, AtSign, ArrowLeft, ArrowUp, BookOpen, Ellipsis, MapPin, MessageCircle, RefreshCw, Sparkles, Users, Waypoints } from 'lucide-react'
import type { UILanguage } from '../i18n'
import { currentUser, DiscussionError, requestId, restoreSession, signIn, subscribeSession } from '../lib/discussions'
import { initialModelPolicy, type ModelPolicy, agentCall } from '../lib/documentAgent'
import { companionReference, referenceKey, savedGuide, savedGuides, saveGuide, forgetGuide, type BookCompanionContext, type BookMessage, type BookReference, type BookResponse } from '../lib/bookCompanion'
import { useBackAction } from '../lib/backNavigation'
import { agentCopy } from './agentCopy'
import { bookCompanionCopy } from './bookCompanionCopy'
import { BookReferencePicker } from './BookReferencePicker'
import { referenceCopy } from './bookReferenceCopy'
import { BookGuide, PassageEvidence } from './BookGuide'
import { DocumentContent } from './DocumentContent'
import { CloudPlans } from './CloudPlans'
import { cloudCopy } from './cloudCopy'
import { DemoAccount, DemoNotice } from './DemoAccount'
import './documentAgent.css'
import './bookCompanion.css'

type Tab = 'chat' | 'people' | 'places' | 'timeline'
export function BookCompanion({ context, ui, onBack, onRead, onGeneral }: {
  context: BookCompanionContext; ui: UILanguage; onBack: () => void; onRead: (paragraph: number, reference?: BookReference, quote?: string) => void; onGeneral: () => void
}) {
  const t = bookCompanionCopy[ui], a = agentCopy[ui]
  const user = useSyncExternalStore(subscribeSession, currentUser, () => null)
  const ref = useMemo(() => companionReference(context, ui, context.scope || (context.quote ? 'sentence' : 'passage')), [context, ui])
  const key = referenceKey(ref), owner = user?.id
  // Keyed child remounts on scope/account changes; late responses cannot alter a new conversation.
  return <BookCompanionSession key={`${owner || 'guest'}:${key}`} {...{ context, ui, onBack, onRead, onGeneral, refValue: ref, user, t, a }} />
}
function BookCompanionSession({ context, ui, onBack, onRead, onGeneral, refValue, user, t, a }: {
  context: BookCompanionContext; ui: UILanguage; onBack: () => void; onRead: (paragraph: number, reference?: BookReference, quote?: string) => void; onGeneral: () => void
  refValue: BookReference; user: ReturnType<typeof currentUser>
  t: typeof bookCompanionCopy[UILanguage]; a: typeof agentCopy[UILanguage]
}) {
  const selectionKey = `bunko-book-selection:${user?.id || 'guest'}:${referenceKey(refValue)}`
  const [selection] = useState(() => {
    try { const value = JSON.parse(sessionStorage.getItem(selectionKey) || 'null'); if (value?.reference?.id && value.meta?.id === value.reference.id && value.meta.chapters?.[value.reference.chapter]?.file === value.reference.file) return value as { reference: BookReference; meta: typeof context.meta } } catch { /* Optional selection persistence. */ }
    return { reference: refValue, meta: context.meta }
  })
  const [reference, setReference] = useState(selection.reference), [referenceMeta, setReferenceMeta] = useState(selection.meta), [picking, setPicking] = useState(false)
  const referenceId = referenceKey(reference), activeReference = useRef(referenceId)
  const mentionStart = useRef(-1)
  const r = referenceCopy[ui]
  const [modelPolicy, setModelPolicy] = useState<ModelPolicy>(initialModelPolicy)
  const [tab, setTab] = useState<Tab>('chat'), [plans, setPlans] = useState(false)
  const artifactSelectionKey = `bunko-book-artifact-selection:${user?.id || 'guest'}:${refValue.id}`
  const [cachedGuides, setCachedGuides] = useState(() => savedGuides(reference))
  const [guide, setGuide] = useState<BookResponse | null>(() => {
    try { const key = localStorage.getItem(artifactSelectionKey); const selected = savedGuides(reference).find(g => g.key === key); if (selected) return selected } catch { /* Optional view preference. */ }
    return savedGuide(reference) || savedGuides(reference)[0] || null
  })
  const [messages, setMessages] = useState<BookMessage[]>([])
  const draftKey = `bunko-book-draft-v2:${user?.id || 'guest'}:${refValue.id}`
  const [draft, setDraft] = useState(() => { try { return sessionStorage.getItem(draftKey) || sessionStorage.getItem(`bunko-book-draft:${user?.id || 'guest'}:${referenceKey(refValue)}`) || '' } catch { return '' } })
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [atBottom, setAtBottom] = useState(true)
  const [auth, setAuth] = useState(false), [demoBusy, setDemoBusy] = useState(false), [consent, setConsent] = useState(false)
  const [report, setReport] = useState<BookMessage | null>(null), [reason, setReason] = useState(''), [notice, setNotice] = useState('')
  const pending = useRef<(() => void) | null>(null), live = useRef(true), cancelledLogin = useRef<(() => void) | null>(null)
  const page = useRef<HTMLElement>(null), scroller = useRef<HTMLDivElement>(null), contents = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null), menu = useRef<HTMLDetailsElement>(null), following = useRef(true), inFlight = useRef(false)
  const manualScroll = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const title = context.meta.titleText[context.language] || context.meta.titleText[context.meta.primary] || context.meta.id
  useBackAction(() => { if (report) setReport(null); else if (consent) { setConsent(false); pending.current = null } else if (picking) setPicking(false); else if (plans) setPlans(false); else if (menuOpen) menu.current?.removeAttribute('open'); else onBack() }, true, 30)
  const fail = useCallback((e: unknown) => {
    if (!live.current) return
    const detail = (e as Error & { detail?: string })?.detail
    setError(e instanceof DiscussionError && detail ? detail : a.error)
  }, [a.error])
  const refresh = useCallback(async () => {
    if (!user) return
    const response = await agentCall<{ messages: BookMessage[]; guide?: BookResponse | null; revision?: string; modelPolicy?: ModelPolicy }>('messages', { book: refValue, ...(referenceId !== referenceKey(refValue) ? { reference } : {}), checkGuide: true })
    if (!live.current || currentUser()?.id !== user.id || inFlight.current || activeReference.current !== referenceId) return
    setMessages(response.messages)
    setModelPolicy(response.modelPolicy || initialModelPolicy)
    const historyGuides = response.messages.flatMap(m => m.kind === 'guide' && m.bookResponse?.people ? [m.bookResponse] : [])
    for (const artifact of historyGuides) saveGuide(artifact.reference, artifact)
    if (response.guide) saveGuide(reference, response.guide)
    const exact = savedGuide(reference)
    // A cache miss at a new passage does not erase a saved artifact. Only invalidate
    // the exact current lookup when its edition revision was actually checked.
    if (!response.guide && exact && response.revision && exact.revision !== response.revision) forgetGuide(reference)
    const available = savedGuides(reference)
    setCachedGuides(available)
    setGuide(current => current || response.guide || available[0] || null)
  }, [refValue, reference, referenceId, user])
  useEffect(() => {
    live.current = true
    void restoreSession().catch(() => {})
    const initial = setTimeout(() => { void refresh().catch(fail) }, 0)
    return () => { live.current = false; clearTimeout(initial); cancelledLogin.current?.() }
  }, [refresh, fail])
  useEffect(() => {
    if (!messages.some(m => m.state === 'processing') || busy) return
    const timer = setTimeout(() => { void refresh().catch(fail) }, 3000)
    return () => clearTimeout(timer)
  }, [messages, busy, refresh, fail])
  useEffect(() => { try { if (draft) sessionStorage.setItem(draftKey, draft); else sessionStorage.removeItem(draftKey) } catch { /* Optional draft persistence. */ } }, [draft, draftKey])
  useEffect(() => {
    const viewport = window.visualViewport
    const resize = () => { page.current?.style.setProperty('--agent-height', `${viewport?.height ?? window.innerHeight}px`); page.current?.style.setProperty('--agent-top', `${viewport?.offsetTop ?? 0}px`) }
    resize(); viewport?.addEventListener('resize', resize); viewport?.addEventListener('scroll', resize)
    return () => { viewport?.removeEventListener('resize', resize); viewport?.removeEventListener('scroll', resize) }
  }, [plans])
  useLayoutEffect(() => { if (composer.current) { composer.current.style.height = 'auto'; composer.current.style.height = draft ? `${Math.min(144, composer.current.scrollHeight)}px` : '44px' } }, [draft, tab, plans])
  useEffect(() => {
    if (!contents.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => { if (tab === 'chat' && following.current && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight })
    observer.observe(contents.current)
    if (scroller.current) observer.observe(scroller.current)
    return () => observer.disconnect()
  }, [tab, plans])
  useLayoutEffect(() => { if (tab === 'chat' && following.current && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight }, [tab, messages, busy])
  useLayoutEffect(() => {
    manualScroll.current = false
    if (scroller.current) scroller.current.scrollTop = tab === 'chat' ? scroller.current.scrollHeight : 0
  }, [tab])
  useEffect(() => {
    if (!menuOpen) return
    const outside = (e: PointerEvent) => { if (e.target instanceof Node && !menu.current?.contains(e.target)) menu.current?.removeAttribute('open') }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [menuOpen])
  const login = (provider: SignInProvider = 'github') => {
    setAuth(true); setError('')
    const flow = signIn(provider); cancelledLogin.current = flow.cancel
    void flow.promise.catch(fail).finally(() => { if (live.current) setAuth(false) })
  }
  const withConsent = (action: () => void) => {
    try { if (localStorage.getItem(`bunko-book-consent-v2:${user?.id}:${modelPolicy.consentKey}`) === 'yes') { action(); return } } catch { /* Ask without persistent storage. */ }
    pending.current = action; setConsent(true)
  }
  const send = async (kind: 'answer' | 'guide', text = draft) => {
    if (inFlight.current || !user || !text.trim()) return
    inFlight.current = true; setBusy(true); setError('')
    const id = requestId(), question = text.trim(), owner = user.id
    following.current = true; setAtBottom(true)
    if (kind === 'answer') setDraft('')
    setMessages(items => [...items, { id, state: 'processing', question, answer: '', papers: [], kind, reference, referenceTitle: referenceMeta.titleText[reference.language] || reference.id }])
    try {
      const result = await agentCall<BookMessage>('send', { book: refValue, ...(referenceId !== referenceKey(refValue) ? { reference } : {}), modelConsent: modelPolicy.providers, text: question, kind, requestId: id })
      if (!live.current || currentUser()?.id !== owner) return
      setMessages(items => items.map(m => m.id === id ? result : m))
      if (result.state === 'failed') setError(result.error || a.error)
      if (kind === 'guide' && result.bookResponse) { selectGuide(result.bookResponse) }
    } catch (e) { fail(e); if (live.current) { if (kind === 'answer') setDraft(question); await refresh().catch(() => {}) } }
    finally { inFlight.current = false; if (live.current) setBusy(false) }
  }
  const selectGuide = (value: BookResponse) => {
    setGuide(value); saveGuide(value.reference, value)
    setCachedGuides(savedGuides(reference))
    try { localStorage.setItem(artifactSelectionKey, value.key) } catch { /* Optional view preference. */ }
  }
  const artifacts = [...messages.flatMap(m => m.kind === 'guide' && m.bookResponse?.people ? [m.bookResponse] : []).reverse(), ...cachedGuides, ...(guide ? [guide] : [])]
    .filter((g, i, all) => all.findIndex(v => v.key === g.key) === i)
  const buildGuide = () => withConsent(() => { void send('guide', t.guide) })
  const chooseReference = (next: BookReference, meta: typeof context.meta) => {
    try { sessionStorage.setItem(selectionKey, JSON.stringify({ reference: next, meta })) } catch { /* Optional reference persistence. */ }
    activeReference.current = referenceKey(next); setReference(next); setReferenceMeta(meta); setGuide(savedGuide(next) || savedGuides(next)[0] || null); setCachedGuides(savedGuides(next)); setPicking(false); setError(''); const at = mentionStart.current; setDraft(value => at >= 0 && value[at] === '@' ? value.slice(0, at) + value.slice(at + 1) : value); mentionStart.current = -1; composer.current?.focus()
  }
  const waiting = busy || messages.some(m => m.state === 'processing')
  if (plans) return <CloudPlans ui={ui} onBack={() => setPlans(false)} />
  return <main ref={page} className="agent-page agent-page-active book-companion" data-tab={tab}>
    <header className="agent-header">
      <button type="button" className="agent-icon-button" onClick={onBack} aria-label={t.back}><ArrowLeft size={20} /></button>
      <div className="agent-heading"><strong>{a.name}</strong><span dir="auto">{title}</span></div>
      <details ref={menu} className="agent-menu" onToggle={e => setMenuOpen(e.currentTarget.open)} onKeyDown={e => { if (e.key === 'Escape') e.currentTarget.removeAttribute('open') }}>
        <summary aria-label={a.more}><Ellipsis size={22} /></summary>
        <div className="agent-menu-panel">
          <button type="button" onClick={() => { menu.current?.removeAttribute('open'); setMenuOpen(false); setPlans(true) }}><BookOpen size={18} />{cloudCopy[ui].title}</button>
          <button type="button" disabled={waiting} onClick={() => { menu.current?.removeAttribute('open'); setPicking(true) }}><AtSign size={18} />{r.title}</button>
          <p>{t.consent.replace('DeepSeek', modelPolicy.providers.join(' / '))}</p>
          <button type="button" onClick={onGeneral} disabled={waiting}>{t.newChat}</button>
        </div>
      </details>
    </header>
    <nav className="book-companion-tabs" aria-label={a.name}>
      {([['chat', MessageCircle], ['people', Users], ['places', MapPin], ['timeline', Waypoints]] as const).map(([value, Icon]) => <button type="button" key={value} aria-pressed={tab === value} onClick={() => { setTab(value); setError('') }}><Icon size={17} /><span>{t[value]}</span></button>)}
    </nav>
    <div className="book-companion-scope"><button type="button" className="book-reference-chip" title={reference.quote || r.current} onClick={() => onRead(reference.paragraph, reference, reference.quote)}><BookOpen size={14} /><span>{referenceMeta.titleText[reference.language] || reference.id} · {reference.scope === 'book' ? r.whole : reference.scope === 'sentence' ? `${r.sentence} · ${reference.quote?.slice(0, 40)}` : `${r.chapter} ${reference.chapter + 1} · ${r.paragraph} ${reference.paragraph + 1}`}</span></button>
      {referenceId !== referenceKey(refValue) && <button type="button" title={r.current} aria-label={r.current} onClick={() => onRead(context.paragraph, refValue)}><BookOpen size={16} /></button>}
      <button type="button" aria-label={t.refresh} title={t.refresh} disabled={waiting || !user} onClick={() => { if (tab === 'chat') void refresh().catch(fail); else buildGuide() }}><RefreshCw size={16} /></button>
    </div>
    {tab !== 'chat' && artifacts.length > 0 && <div className="book-artifact-picker"><label><span>{t.savedGuides}</span><select aria-label={t.savedGuides} value={guide?.key || ''} onChange={e => { const selected = artifacts.find(g => g.key === e.target.value); if (selected) selectGuide(selected) }}>
      {artifacts.map((g, i) => <option key={g.key} value={g.key}>{g.title || g.reference.id} · {g.coverage.scope === 'book' ? r.whole : `${r.chapter} ${g.reference.chapter + 1} · ${r.paragraph} ${g.reference.paragraph + 1}`} · {i + 1}</option>)}
    </select></label></div>}
    {user?.kind === 'demo' && <DemoNotice ui={ui} />}
    <section className="agent-conversation">
      <div className="agent-history">
        <div ref={scroller} className="agent-messages" onTouchMove={() => composer.current?.blur()} onWheel={() => { manualScroll.current = true }} onTouchStart={() => { manualScroll.current = true }} onPointerDown={() => { manualScroll.current = true }} onScroll={e => {
          const el = e.currentTarget, bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
          if (manualScroll.current) { following.current = bottom; setAtBottom(bottom) }
        }}>
          <div ref={contents} className="agent-message-content">
            {!user && <section className="book-companion-login">
              <p>{t.hint}</p><SignInOptions ui={ui} disabled={auth || demoBusy} onSelect={login} />
              {auth && <button type="button" onClick={() => cancelledLogin.current?.()}>{a.cancel}</button>}
              <DemoAccount ui={ui} disabled={auth} onBusy={setDemoBusy} />
            </section>}
            {tab === 'chat' ? <>
              {!messages.length && <div className="agent-empty"><Sparkles size={30} /><h1>{t.intro}</h1><p>{t.hint}</p>
                <div className="agent-suggestions">{[t.explain, t.names].map(prompt => <button type="button" key={prompt} onClick={() => { setDraft(prompt); composer.current?.focus() }}>{prompt}</button>)}</div>
              </div>}
              {messages.map(m => <article className="agent-exchange" key={m.id}>
                <p className="agent-question">{m.question}</p>
                {m.reference && <button type="button" className="agent-message-reference" onClick={() => onRead(m.reference!.paragraph, m.reference, m.reference?.quote)}><BookOpen size={13} /><span>{m.referenceTitle || m.bookResponse?.title || m.reference.id} · {r.chapter} {m.reference.chapter + 1} · {r.paragraph} {m.reference.paragraph + 1}</span></button>}
                <div className="agent-answer">{m.answer ? <>
                  <DocumentContent text={m.answer} preparing={a.preparing} failed={a.renderFailed} />
                  {m.bookResponse?.knowledge && m.bookResponse.knowledge !== 'passages' && <p className="guide-uncertain">{t.background}</p>}
                  {m.bookResponse && <PassageEvidence citations={m.bookResponse.citations} ui={ui} onRead={(paragraph, citation) => onRead(paragraph, { ...m.bookResponse!.reference, ...(citation?.chapter !== undefined ? { chapter: citation.chapter, file: citation.file! } : {}) }, citation?.quote)} />}
                  {m.kind === 'guide' && m.bookResponse && <button type="button" onClick={() => { selectGuide(m.bookResponse!); setTab('people') }}><Users size={16} />{t.people} · {t.places} · {t.timeline}</button>}
                  <div className="agent-answer-tools"><small title={a.ai}>Bunko · AI</small><button type="button" className="agent-report" onClick={() => { setReason(''); setReport(m) }}>{a.report}</button></div>
                </> : <p role="status">{m.error || (m.state === 'processing' ? t.generating : a.interrupted)}</p>}</div>
              </article>)}
            </> : guide ? <><BookGuide guide={guide} tab={tab} ui={ui} onRead={(paragraph, citation) => onRead(paragraph, { ...guide.reference, ...(citation?.chapter !== undefined ? { chapter: citation.chapter, file: citation.file! } : {}) }, citation?.quote)} /><p className="guide-saved">{t.cached}</p>
              {messages.some(m => m.bookResponse?.key === guide.key) && <button type="button" className="agent-report" onClick={() => { setReason(''); setReport(messages.find(m => m.bookResponse?.key === guide.key) || null) }}>{t.report}</button>}
            </> : <div className="agent-empty">
              <Sparkles size={30} /><h1>{t[tab]}</h1><p>{t.hint}</p><button type="button" className="guide-build" disabled={!user || waiting} onClick={buildGuide}>{waiting ? t.generating : t.guide}</button><p className="guide-caption">{t.savedHint}</p>
            </div>}
          </div>
        </div>
        {tab === 'chat' && !atBottom && <button type="button" className="agent-jump" aria-label={a.latest} onClick={() => { following.current = true; manualScroll.current = false; if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; setAtBottom(true) }}><ArrowDown size={18} /></button>}
      </div>
      <div className="agent-composer-area">
        {error && !(tab === 'chat' && messages.some(m => m.state === 'failed' && m.error === error)) && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        {tab === 'chat' && <form className="agent-composer" onSubmit={e => { e.preventDefault(); withConsent(() => { void send('answer') }) }}>
          <button type="button" className="reference-add" disabled={waiting} aria-label={r.title} title={r.title} onClick={() => setPicking(true)}><AtSign size={20} /></button>
          <textarea ref={composer} value={draft} rows={1} maxLength={8000} aria-label={t.placeholder} placeholder={t.placeholder} onChange={e => { setDraft(e.target.value); if (e.target.value.endsWith('@') && !waiting) { mentionStart.current = e.target.value.length - 1; setPicking(true) } }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && (e.ctrlKey || e.metaKey)) { e.preventDefault(); withConsent(() => { void send('answer') }) } }} />
          <button type="submit" className="agent-send" disabled={!user || waiting || !draft.trim()} aria-label={a.send}><ArrowUp size={20} /></button>
        </form>}
      </div>
    </section>
    {picking && <BookReferencePicker initial={reference} meta={referenceMeta} ui={ui} onClose={() => { mentionStart.current = -1; setPicking(false) }} onChoose={chooseReference} />}
    {consent && <div className="agent-modal-backdrop"><section className="agent-modal" role="dialog" aria-modal="true" aria-labelledby="book-consent-title">
      <h2 id="book-consent-title">{a.consentTitle}</h2><p>{t.consent.replace('DeepSeek', modelPolicy.providers.join(' / '))}</p>
      <button type="button" onClick={() => { setConsent(false); pending.current = null }}>{a.cancel}</button>
      <button type="button" onClick={() => { try { localStorage.setItem(`bunko-book-consent-v2:${user?.id}:${modelPolicy.consentKey}`, 'yes') } catch { /* Continue for this request. */ } setConsent(false); const action = pending.current; pending.current = null; action?.() }}>{a.consentAllow}</button>
    </section></div>}
    {report && <div className="agent-modal-backdrop"><form className="agent-modal" role="dialog" aria-modal="true" aria-labelledby="book-report-title" onSubmit={e => {
      e.preventDefault()
      if (busy || reason.trim().length < 3) return
      setBusy(true)
      void agentCall('report', { messageId: report.id, reason: reason.trim() }).then(() => { if (live.current) { setReport(null); setNotice(a.reported) } }).catch(fail).finally(() => { if (live.current) setBusy(false) })
    }}><h2 id="book-report-title">{a.report}</h2><textarea aria-label={a.reportHint} placeholder={a.reportHint} value={reason} maxLength={2000} onChange={e => setReason(e.target.value)} />
      <button type="button" onClick={() => setReport(null)}>{a.cancel}</button><button type="submit" disabled={busy || reason.trim().length < 3}>{a.report}</button>
    </form></div>}
  </main>
}
