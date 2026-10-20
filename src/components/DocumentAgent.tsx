import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { ArrowDown, AtSign, ArrowLeft, ArrowUp, BookOpen, FileText, Ellipsis, LoaderCircle, LogOut, Paperclip, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { currentUser, restoreSession, signIn, signOut, subscribeSession, DiscussionError, requestId } from '../lib/discussions'
import { loadIndex, loadMeta } from '../lib/library'
import type { BookMeta } from '../types'
import type { BookReference } from '../lib/bookCompanion'
import { BookReferencePicker } from './BookReferencePicker'
import { referenceCopy } from './bookReferenceCopy'
import { ModelSettings } from './ModelSettings'
import { initialModelPolicy, type ModelPolicy } from '../lib/documentAgent'
import { agentCall, uploadDocument, type AgentMessage, type PrivateDocument, type PaperMatch } from '../lib/documentAgent'
import { useBackAction } from '../lib/backNavigation'
import type { UILanguage } from '../i18n'
import { agentCopy } from './agentCopy'
import { DocumentContent } from './DocumentContent'
import { DemoAccount, DemoNotice } from './DemoAccount'
import { CloudPlans } from './CloudPlans'
import { cloudCopy } from './cloudCopy'
import { BUNKO_LEGAL_API } from '../lib/serviceOrigins'
import './documentAgent.css'

type AgentProps = { ui: UILanguage; onBack: () => void; onBook?: (reference: BookReference, meta: BookMeta, draft: string) => void }
export function DocumentAgent({ ui, onBack, onBook }: AgentProps) {
  const user = useSyncExternalStore(subscribeSession, currentUser, () => null)
  return <DocumentAgentSession key={user?.id || 'guest'} {...{ ui, onBack, onBook, user }} />
}
function DocumentAgentSession({ ui, onBack, onBook, user }: AgentProps & { user: ReturnType<typeof currentUser> }) {
  const t = agentCopy[ui]
  const [bookPicker, setBookPicker] = useState<{ meta: BookMeta; reference: BookReference } | null>(null)
  const mentionStart = useRef(-1)
  const [modelPolicy, setModelPolicy] = useState<ModelPolicy>(initialModelPolicy), [modelAdmin, setModelAdmin] = useState(false), [modelsOpen, setModelsOpen] = useState(false)
  const page = useRef<HTMLElement>(null), history = useRef<HTMLDivElement>(null), historyContent = useRef<HTMLDivElement>(null), followLatest = useRef(true), userScrolling = useRef(false), savedScroll = useRef(0), menu = useRef<HTMLDetailsElement>(null)
  const [atBottom, setAtBottom] = useState(true), [plans, setPlans] = useState(false), [menuOpen, setMenuOpen] = useState(false)
  const [documents, setDocuments] = useState<PrivateDocument[]>([])
  const storageKey = `bunko-agent-session:${user?.id || 'guest'}`
  const readSaved = () => { try { return JSON.parse(sessionStorage.getItem(storageKey) || '{}') as { selected?: string; drafts?: Record<string, string> } } catch { return {} } }
  const [selected, setSelected] = useState(() => readSaved().selected || '')
  const [reading, setReading] = useState<PrivateDocument | null>(null)
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [draft, setDraft] = useState(() => readSaved().drafts?.[selected] || '')
  useEffect(() => { try { const old = JSON.parse(sessionStorage.getItem(storageKey) || '{}'); sessionStorage.setItem(storageKey, JSON.stringify({ selected, drafts: { ...old.drafts, [selected]: draft } })) } catch { /* Optional draft persistence. */ } }, [draft, selected, storageKey])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [fontSize, setFontSize] = useState(20)
  const [auth, setAuth] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)
  const [confirm, setConfirm] = useState<PrivateDocument | 'all' | null>(null)
  const [report, setReport] = useState<AgentMessage | null>(null)
  const [reason, setReason] = useState('')
  const [notice, setNotice] = useState('')
  const [cloudConsent, setCloudConsent] = useState(false)
  const pendingCloud = useRef<(() => void) | null>(null)
  const withCloudConsent = (action: () => void) => {
    try { if (localStorage.getItem(`bunko-cloud-consent-v2:${user?.id}:${modelPolicy.consentKey}`) === 'yes') { action(); return } } catch { /* Ask again if storage is unavailable. */ }
    pendingCloud.current = action; setCloudConsent(true)
  }
  const file = useRef<HTMLInputElement>(null), composer = useRef<HTMLTextAreaElement>(null)
  const cancelAuth = useRef<(() => void) | null>(null)
  const activeUser = useRef(user?.id)
  useEffect(() => { activeUser.current = user?.id }, [user?.id])
  useEffect(() => {
    const viewport = window.visualViewport
    const resize = () => { page.current?.style.setProperty('--agent-height', `${viewport?.height ?? window.innerHeight}px`); page.current?.style.setProperty('--agent-top', `${viewport?.offsetTop ?? 0}px`) }
    resize(); viewport?.addEventListener('resize', resize); viewport?.addEventListener('scroll', resize); window.addEventListener('resize', resize)
    return () => { viewport?.removeEventListener('resize', resize); viewport?.removeEventListener('scroll', resize); window.removeEventListener('resize', resize) }
  }, [plans])
  useLayoutEffect(() => { if (history.current) history.current.scrollTop = followLatest.current ? history.current.scrollHeight : savedScroll.current }, [messages, busy, plans])
  useLayoutEffect(() => { if (composer.current) { composer.current.style.height = 'auto'; composer.current.style.height = draft ? `${Math.min(144, composer.current.scrollHeight)}px` : '44px' } }, [draft, plans])
  useEffect(() => {
    if (!historyContent.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => { if (followLatest.current && history.current) history.current.scrollTop = history.current.scrollHeight })
    observer.observe(historyContent.current); if (history.current) observer.observe(history.current)
    return () => observer.disconnect()
  }, [plans, user?.id])
  const latest = () => { followLatest.current = true; userScrolling.current = false; setAtBottom(true); if (history.current) history.current.scrollTop = history.current.scrollHeight }
  const activeDocument = useRef(selected)
  useEffect(() => { activeDocument.current = selected }, [selected])
  const doc = documents.find(d => d.id === selected)
  useBackAction(() => { menu.current?.removeAttribute('open') }, menuOpen, 30)
  useEffect(() => {
    if (!menuOpen) return
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !menu.current?.contains(event.target)) menu.current?.removeAttribute('open') }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') menu.current?.removeAttribute('open') }
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [menuOpen])
  useBackAction(() => { if (bookPicker) { setBookPicker(null); mentionStart.current = -1 } else if (reading) setReading(null); else onBack() }, true, 20)
  useBackAction(() => { setConfirm(null); setReport(null); setCloudConsent(false); pendingCloud.current = null }, !!confirm || !!report || cloudConsent, 40)
  useEffect(() => {
    if (!reading && !confirm && !report && !cloudConsent) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [reading, confirm, report, cloudConsent])
  const failure = useCallback((e: unknown) => {
    const value = e as Error & { detail?: string }
    setError(value.message === 'file_limit' ? t.fileLimit : e instanceof DiscussionError && e.code === 'not_configured' ? t.unavailable : value.detail || t.error)
  }, [t])
  const refresh = useCallback(async () => {
    const owner = user?.id
    if (!owner) return
    const result = await agentCall<{ documents: PrivateDocument[]; modelPolicy?: ModelPolicy; modelAdmin?: boolean }>('state')
    if (activeUser.current === owner) { setDocuments(result.documents); setModelPolicy(result.modelPolicy || initialModelPolicy); setModelAdmin(result.modelAdmin === true) }
  }, [user?.id])
  useEffect(() => { void restoreSession().catch(() => {}); return () => cancelAuth.current?.() }, [])
  useEffect(() => {
    if (!user) return
    let active = true
    const load = () => { void refresh().catch(e => { if (active) failure(e) }) }
    load()
    const timer = setInterval(load, 5000)
    return () => { active = false; clearInterval(timer) }
  }, [user, refresh, failure])
  useEffect(() => {
    if (!user) return
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const load = async () => {
      try {
        const result = await agentCall<{ messages: AgentMessage[] }>('messages', { documentId: selected })
        if (!active) return
        setMessages(result.messages)
        if (result.messages.some(m => m.state === 'processing')) timer = setTimeout(() => { void load() }, 3000)
      } catch (e) { if (active) failure(e) }
    }
    if (!busy) void load()
    return () => { active = false; clearTimeout(timer) }
  }, [selected, user, failure, busy])
  const login = () => {
    setError(''); setAuth(true)
    const flow = signIn(); cancelAuth.current = flow.cancel
    void flow.promise.catch(failure).finally(() => { setAuth(false); cancelAuth.current = null })
  }
  const run = async (state: string, action: () => Promise<void>) => {
    if (busy) return
    setBusy(state); setError(''); setNotice('')
    try { await action() } catch (e) { failure(e) } finally { setBusy('') }
  }
  const open = async (id: string) => run('read', async () => {
    const owner = user?.id
    const value = await agentCall<PrivateDocument>('document', { documentId: id })
    if (activeUser.current === owner) setReading(value)
  })
  const upload = async (files: FileList | null) => {
    const chosen = files?.[0]
    if (!chosen) return
    await run('upload', async () => {
      const owner = user?.id
      const result = await uploadDocument(chosen)
      if (activeUser.current !== owner) return
      setSelected(result.id); setDraft(''); setMessages([]); await refresh()
    })
    if (file.current) file.current.value = ''
  }
  const send = async (text = draft) => run('send', async () => {
    if (!text.trim()) return
    const owner = user?.id, target = selected, question = text.trim(), id = requestId()
    followLatest.current = true; userScrolling.current = false; setAtBottom(true); setDraft('')
    setMessages(items => [...items, { id, state: 'processing', question, answer: '', papers: [] }])
    try {
      const response = await agentCall<AgentMessage>('send', { modelConsent: modelPolicy.providers, text: question, documentId: target, requestId: id })
      if (activeUser.current === owner && activeDocument.current === target) setMessages(items => items.map(m => m.id === id ? response : m))
    } catch (e) {
      if (activeUser.current === owner && activeDocument.current === target) {
        setDraft(question)
        // Read the durable receipt on refresh before sending a new request.
        const result = await agentCall<{ messages: AgentMessage[] }>('messages', { documentId: target }).catch(() => null)
        if (result) setMessages(result.messages)
      }
      throw e
    }
  })
  const importPaper = (paper: PaperMatch) => run('upload', async () => {
    const result = await agentCall<PrivateDocument>('import', { url: paper.pdfUrl, name: `${paper.title.slice(0, 160)}.pdf`, requestId: requestId() })
    setSelected(result.id); setDraft(''); setMessages([]); await refresh()
  })
  const choose = (id: string) => { if (busy) return; followLatest.current = true; userScrolling.current = false; setAtBottom(true); setSelected(id); setDraft(readSaved().drafts?.[id] || ''); setMessages([]); setError('') }
  const openBookPicker = async () => {
    if (!onBook || busy) return
    const owner = user?.id
    try {
      const index = await loadIndex(), first = index.books[0]
      if (!first) return
      const meta = await loadMeta(first.id)
      if (activeUser.current !== owner) return
      const reference: BookReference = { id: meta.id, file: meta.chapters[0].file, chapter: 0, paragraph: 0, language: meta.primary, replyLanguage: ui, scope: 'book' }
      setBookPicker({ meta, reference })
    } catch (error) { failure(error) }
  }
  const stateLabel = (state: string) => t[state as 'queued' | 'processing' | 'ready' | 'failed' | 'interrupted'] || state
  if (modelsOpen && modelAdmin && user) return <ModelSettings key={user.id} ui={ui} onBack={() => { setModelsOpen(false); void refresh().catch(failure) }} />
  if (plans) return <CloudPlans ui={ui} onBack={() => setPlans(false)} />
  return <main ref={page} className={`agent-page${user ? ' agent-page-active' : ''}`}>
    <header className="agent-header">
      <button type="button" className="agent-icon-button" onClick={onBack} aria-label={t.back}><ArrowLeft size={20} /></button>
      <div className="agent-heading"><strong>{t.name}</strong><span>Bunko</span></div>
      <details ref={menu} className="agent-menu" onKeyDown={e => { if (e.key === 'Escape') { e.currentTarget.removeAttribute('open'); e.stopPropagation() } }} onToggle={e => setMenuOpen(e.currentTarget.open)}>
        <summary aria-label={t.more} title={t.more}><Ellipsis size={22} /></summary>
        <div className="agent-menu-panel">
          <button type="button" onClick={() => { menu.current?.removeAttribute('open'); setMenuOpen(false); setPlans(true) }}><BookOpen size={18} />{cloudCopy[ui].title}</button>
          <>{modelAdmin && <button type="button" onClick={() => { menu.current?.removeAttribute('open'); setModelsOpen(true) }}>{({ en: 'Assistant models', 'zh-Hans': '助手模型', 'zh-Hant': '助手模型', ja: 'アシスタントのモデル' })[ui]}</button>}</><p>{t.fileHint}</p><p>{t.privacy}</p>
          <a href={`${BUNKO_LEGAL_API}/privacy.html`} target="_blank" rel="noopener noreferrer">{t.privacyLink}</a>
          {user && <><small>{user.login}</small><button type="button" disabled={!!busy} onClick={() => { void signOut().catch(failure); setDocuments([]); setMessages([]); setReading(null); setSelected(''); setDraft('') }}><LogOut size={17} />{t.signOut}</button></>}
        </div>
      </details>
    </header>
    {user?.kind === 'demo' && <DemoNotice ui={ui} />}
    {!user ? <section className="agent-welcome">
      <BookOpen size={36} /><h1>{t.intro}</h1><p>{t.hint}</p><p className="agent-muted">{t.privacy}</p>
      <button type="button" className="primary" onClick={login} disabled={auth || demoBusy}>{auth ? t.signingIn : t.signIn}</button>
      {auth && <button type="button" onClick={() => cancelAuth.current?.()}>{t.cancel}</button>}
      <DemoAccount ui={ui} disabled={auth} onBusy={setDemoBusy} />
      {error && <p role="alert">{error}</p>}
    </section> : <div className="agent-layout">
      <aside className="agent-library">
        <div className="agent-section-heading"><h2>{t.files}</h2><div className="agent-library-tools">
          <button type="button" className={!selected ? 'selected' : ''} onClick={() => choose('')} disabled={!!busy} aria-label={t.newChat} title={t.newChat} aria-pressed={!selected}><Plus size={18} /></button>
          <button type="button" onClick={() => { void refresh().catch(failure) }} disabled={!!busy} aria-label={t.refresh} title={t.refresh}><RefreshCw size={17} /></button>
          <button type="button" disabled={!!busy || (!documents.length && !messages.length)} onClick={() => setConfirm('all')} aria-label={t.deleteAll} title={t.deleteAll}><Trash2 size={17} /></button>
        </div></div>
        <div className="agent-document-list">
          {documents.map(d => <article key={d.id} className={selected === d.id ? 'selected' : ''}>
            <button type="button" className="agent-document-title" onClick={() => choose(d.id)} disabled={!!busy}><FileText size={18} /><span>{d.name}<small>{stateLabel(d.state)}</small></span></button>
            {d.error && <p className="agent-document-error">{d.error}</p>}
            <div className="agent-document-actions">
              {d.state === 'ready' && <button type="button" onClick={() => { void open(d.id) }} disabled={!!busy}><BookOpen size={15} />{t.read}</button>}
              {['failed', 'interrupted'].includes(d.state) && d.resumable && <button type="button" disabled={!!busy} onClick={() => { void run('resume', async () => { await agentCall('resume', { documentId: d.id }); await refresh() }) }}>{t.resume}</button>}
              <button type="button" disabled={!!busy} onClick={() => setConfirm(d)} aria-label={`${t.remove}: ${d.name}`}><Trash2 size={15} /></button>
            </div>
          </article>)}
        </div>
      </aside>
      <section className="agent-conversation" aria-label={t.name}>
        {doc && <div className="agent-context"><FileText size={17} /><strong>{doc.name}</strong><button type="button" onClick={() => choose('')} disabled={!!busy} aria-label={t.newChat}><X size={17} /></button></div>}
        <div className="agent-history">
        <div ref={history} className="agent-messages" role="log" tabIndex={0} onWheel={() => { userScrolling.current = true }} onTouchMove={() => { userScrolling.current = true }} onPointerDown={() => { userScrolling.current = true }} onKeyDown={e => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) userScrolling.current = true }} aria-label={t.name} aria-live="polite" aria-busy={busy === 'send'} onScroll={() => { const el = history.current; if (el) { const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 64; if (!bottom && !userScrolling.current) return; savedScroll.current = el.scrollTop; followLatest.current = bottom; if (bottom) userScrolling.current = false; setAtBottom(bottom) } }}>
          <div ref={historyContent} className="agent-message-content">
          {!messages.length && <div className="agent-empty"><h1>{doc ? doc.name : t.intro}</h1><p>{doc ? stateLabel(doc.state) : t.hint}</p>
            <div className="agent-suggestions">{(doc ? [t.summarize, t.explain, t.translate] : [t.search, t.explain]).map(prompt => <button type="button" key={prompt} onClick={() => { setDraft(prompt); composer.current?.focus() }}>{prompt}</button>)}</div>
          </div>}
          {messages.map(m => <article className="agent-exchange" key={m.id}>
            <p className="agent-question">{m.question}</p>
            <div className="agent-answer">{m.answer ? <><DocumentContent key={m.id} text={m.answer} preparing={t.preparing} failed={t.renderFailed} /></> : <p>{m.error || (m.state === 'processing' ? t.sending : t.interrupted)}</p>}
              {m.papers.map(p => <article className="agent-paper" key={p.pdfUrl}><h3>{p.title}</h3><p>{p.authors} {p.year}</p><p>{p.summary}</p><button type="button" disabled={!!busy} onClick={() => { withCloudConsent(() => { void importPaper(p) }) }}><BookOpen size={16} />{t.import}</button><a href={p.source} target="_blank" rel="noopener noreferrer">{t.source}</a></article>)}
              {m.answer && <div className="agent-answer-tools"><small title={t.ai}>Bunko · AI</small><button type="button" className="agent-report" onClick={() => { setReason(''); setReport(m) }}>{t.report}</button></div>}
            </div>
          </article>)}
          </div>
        </div>
        {!atBottom && <button type="button" className="agent-jump" onClick={latest} aria-label={t.latest} title={t.latest}><ArrowDown size={18} /></button>}
        </div>
        <div className="agent-composer-area">
          {error && <p className="notice error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
          <form className="agent-composer" onSubmit={e => { e.preventDefault(); withCloudConsent(() => { void send() }) }}>
            <input ref={file} type="file" accept=".pdf,.docx,.md,.mmd,.txt,.tex,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" hidden onChange={e => { void upload(e.target.files) }} />
            <button type="button" className="agent-attach" disabled={!!busy} onClick={() => withCloudConsent(() => file.current?.click())} aria-label={busy === 'upload' ? t.uploading : t.attach} title={t.fileHint}><Paperclip size={20} /></button>
            {onBook && <button type="button" disabled={!!busy} aria-label={referenceCopy[ui].title} onClick={() => { mentionStart.current = -1; void openBookPicker() }}><AtSign size={20} /></button>}
            <textarea ref={composer} aria-label={t.placeholder} value={draft} onChange={e => { setDraft(e.target.value); if (e.target.value.endsWith('@') && onBook && !busy) { mentionStart.current = e.target.value.length - 1; void openBookPicker() } }} placeholder={t.placeholder} maxLength={8000} rows={1} />
            <button type="submit" className="agent-send" aria-label={t.send} disabled={!!busy || !draft.trim() || (!!doc && doc.state !== 'ready')}>{busy ? <LoaderCircle className="spinning" size={20} /> : <ArrowUp size={21} />}</button>
          </form>
        </div>
      </section>
    </div>}
    {reading && user && <section className="document-reader" role="dialog" aria-modal="true" aria-label={reading.name} style={{ '--document-font': `${fontSize}px` } as CSSProperties}>
      <header><button type="button" onClick={() => setReading(null)} aria-label={t.close}><ArrowLeft size={20} /></button><strong>{reading.name}</strong><button type="button" onClick={() => setFontSize(n => Math.max(18, n - 2))} aria-label={t.smaller}>A−</button><button type="button" onClick={() => setFontSize(n => Math.min(30, n + 2))} aria-label={t.bigger}>A+</button></header>
      <article><DocumentContent key={reading.id} document={reading} preparing={t.preparing} failed={t.renderFailed} /></article>
      <footer><button type="button" onClick={() => { choose(reading.id); setReading(null); composer.current?.focus() }}>{t.chat}</button></footer>
    </section>}
    {bookPicker && onBook && <BookReferencePicker meta={bookPicker.meta} initial={bookPicker.reference} ui={ui} onClose={() => { setBookPicker(null); mentionStart.current = -1 }} onChoose={(reference, meta) => {
      const at = mentionStart.current, question = at >= 0 && draft[at] === '@' ? draft.slice(0, at) + draft.slice(at + 1) : draft
      setDraft(question); setBookPicker(null); mentionStart.current = -1; onBook(reference, meta, question)
    }} />}
    {cloudConsent && <div className="agent-modal-backdrop"><section className="agent-modal" role="dialog" aria-modal="true" aria-label={t.consentTitle}>
      <h2>{t.consentTitle}</h2><p>{t.consentBody.replace('DeepSeek', modelPolicy.providers.join(' / '))}</p><p><a href={`${BUNKO_LEGAL_API}/privacy.html`} target="_blank" rel="noopener noreferrer">{t.privacyLink}</a></p>
      <button type="button" onClick={() => { setCloudConsent(false); pendingCloud.current = null }}>{t.cancel}</button>
      <button type="button" onClick={() => {
        try { localStorage.setItem(`bunko-cloud-consent-v2:${user?.id}:${modelPolicy.consentKey}`, 'yes') } catch { /* Consent applies to this action only. */ }
        setCloudConsent(false); const action = pendingCloud.current; pendingCloud.current = null; action?.()
      }}>{t.consentAllow}</button>
    </section></div>}
    {(confirm || report) && <div className="agent-modal-backdrop"><section className="agent-modal" role="dialog" aria-modal="true" aria-label={report ? t.report : t.deleteTitle}>
      <h2>{report ? t.report : confirm === 'all' ? t.deleteAllTitle : t.deleteTitle}</h2>
      {report ? <textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={2000} aria-label={t.reportHint} placeholder={t.reportHint} /> : confirm !== 'all' && <p>{confirm?.name}</p>}
      <button type="button" onClick={() => { setConfirm(null); setReport(null) }}>{t.cancel}</button>
      <button type="button" disabled={!!busy || (!!report && reason.trim().length < 3)} onClick={() => { void run('delete', async () => {
        if (report) { await agentCall('report', { messageId: report.id, reason }); setNotice(t.reported); setReport(null); return }
        if (confirm === 'all') { await agentCall('clear', { confirm: 'DELETE' }); setSelected(''); setMessages([]) }
        else if (confirm) { await agentCall('delete', { documentId: confirm.id, confirm: 'DELETE' }); if (selected === confirm.id) { setSelected(''); setMessages([]) } }
        setConfirm(null); await refresh()
      }) }}>{report ? t.report : t.confirm}</button>
    </section></div>}
  </main>
}
