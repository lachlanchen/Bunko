import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { ArrowLeft, ArrowUp, BookOpen, FileText, LoaderCircle, Paperclip, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { currentUser, restoreSession, signIn, signOut, subscribeSession, DiscussionError, requestId } from '../lib/discussions'
import { agentCall, uploadDocument, type AgentMessage, type PrivateDocument, type PaperMatch } from '../lib/documentAgent'
import { useBackAction } from '../lib/backNavigation'
import type { UILanguage } from '../i18n'
import { agentCopy } from './agentCopy'
import { DocumentContent } from './DocumentContent'
import { DemoAccount, DemoNotice } from './DemoAccount'
import { cloudCopy } from './cloudCopy'
import './documentAgent.css'

export function DocumentAgent({ ui, onBack, onCloud }: { ui: UILanguage; onBack: () => void; onCloud: () => void }) {
  const t = agentCopy[ui]
  const user = useSyncExternalStore(subscribeSession, currentUser, () => null)
  const [documents, setDocuments] = useState<PrivateDocument[]>([])
  const [selected, setSelected] = useState('')
  const [reading, setReading] = useState<PrivateDocument | null>(null)
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [draft, setDraft] = useState('')
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
    try { if (localStorage.getItem(`bunko-cloud-consent-v1:${user?.id}`) === 'yes') { action(); return } } catch { /* Ask again if storage is unavailable. */ }
    pendingCloud.current = action; setCloudConsent(true)
  }
  const file = useRef<HTMLInputElement>(null), composer = useRef<HTMLTextAreaElement>(null)
  const cancelAuth = useRef<(() => void) | null>(null)
  const activeUser = useRef(user?.id)
  useEffect(() => { activeUser.current = user?.id }, [user?.id])
  const activeDocument = useRef(selected)
  useEffect(() => { activeDocument.current = selected }, [selected])
  const doc = documents.find(d => d.id === selected)
  useBackAction(() => { if (reading) setReading(null); else onBack() }, true, 20)
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
    const result = await agentCall<{ documents: PrivateDocument[] }>('state')
    if (activeUser.current === owner) setDocuments(result.documents)
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
      setSelected(result.id); setMessages([]); await refresh()
    })
    if (file.current) file.current.value = ''
  }
  const send = async (text = draft) => run('send', async () => {
    if (!text.trim()) return
    const owner = user?.id, target = selected, question = text.trim(), id = requestId()
    setDraft('')
    setMessages(items => [...items, { id, state: 'processing', question, answer: '', papers: [] }])
    try {
      const response = await agentCall<AgentMessage>('send', { text: question, documentId: target, requestId: id })
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
    setSelected(result.id); setMessages([]); await refresh()
  })
  const choose = (id: string) => { if (busy) return; setSelected(id); setMessages([]); setError('') }
  const stateLabel = (state: string) => t[state as 'queued' | 'processing' | 'ready' | 'failed' | 'interrupted'] || state
  return <main className="agent-page">
    <header className="agent-header">
      <button type="button" onClick={onBack} aria-label={t.back}><ArrowLeft size={20} /></button>
      <div><strong>Bunko</strong><span>{t.name}</span></div>
      <button type="button" onClick={onCloud}>{cloudCopy[ui].title}</button>
      {user && <button type="button" className="agent-account" disabled={!!busy} onClick={() => { void signOut().catch(failure); setDocuments([]); setMessages([]); setReading(null); setSelected('') }}>{user.login} · {t.signOut}</button>}
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
        <div className="agent-section-heading"><h2>{t.files}</h2><button type="button" onClick={() => { void refresh().catch(failure) }} aria-label={t.refresh}><RefreshCw size={16} /></button></div>
        <button type="button" className={`agent-general ${!selected ? 'selected' : ''}`} onClick={() => choose('')} disabled={!!busy}><Plus size={17} />{t.newChat}</button>
        {!documents.length && <p className="agent-muted">{t.empty}</p>}
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
        <button className="agent-clear" type="button" disabled={!!busy} onClick={() => setConfirm('all')}>{t.deleteAll}</button>
      </aside>
      <section className="agent-conversation" aria-label={t.name}>
        <div className="agent-context">
          {doc ? <><FileText size={19} /><div><small>{t.selected}</small><strong>{doc.name}</strong></div><button type="button" onClick={() => choose('')} disabled={!!busy} aria-label={t.newChat}><X size={17} /></button></> : <><Search size={19} /><span>{t.hint}</span></>}
        </div>
        <div className="agent-messages" aria-live="polite" aria-busy={busy === 'send'}>
          {!messages.length && <div className="agent-empty"><h1>{doc ? doc.name : t.intro}</h1><p>{doc ? stateLabel(doc.state) : t.hint}</p>
            <div className="agent-suggestions">{(doc ? [t.summarize, t.explain, t.translate] : [t.search]).map(prompt => <button type="button" key={prompt} onClick={() => { setDraft(prompt); composer.current?.focus() }}>{prompt}</button>)}</div>
          </div>}
          {messages.map(m => <article className="agent-exchange" key={m.id}>
            <p className="agent-question">{m.question}</p>
            <div className="agent-answer">{m.answer ? <><small>{t.ai}</small><DocumentContent key={m.id} text={m.answer} preparing={t.preparing} failed={t.renderFailed} /></> : <p>{m.error || (m.state === 'processing' ? t.sending : t.interrupted)}</p>}
              {m.papers.map(p => <article className="agent-paper" key={p.pdfUrl}><h3>{p.title}</h3><p>{p.authors} {p.year}</p><p>{p.summary}</p><button type="button" disabled={!!busy} onClick={() => { withCloudConsent(() => { void importPaper(p) }) }}><BookOpen size={16} />{t.import}</button><a href={p.source} target="_blank" rel="noopener noreferrer">{t.source}</a></article>)}
              {m.answer && <button type="button" className="agent-report" onClick={() => { setReason(''); setReport(m) }}>{t.report}</button>}
            </div>
          </article>)}
        </div>
        <div className="agent-composer-area">
          {error && <p className="notice error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
          <form className="agent-composer" onSubmit={e => { e.preventDefault(); withCloudConsent(() => { void send() }) }}>
            <input ref={file} type="file" accept=".pdf,.docx,.md,.mmd,.txt,.tex,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" hidden onChange={e => { void upload(e.target.files) }} />
            <textarea ref={composer} aria-label={t.placeholder} value={draft} onChange={e => setDraft(e.target.value)} placeholder={t.placeholder} maxLength={8000} rows={3} />
            <div><button type="button" disabled={!!busy} onClick={() => withCloudConsent(() => file.current?.click())} title={t.fileHint}><Paperclip size={20} />{busy === 'upload' ? t.uploading : t.attach}</button>
              <button type="submit" className="agent-send" aria-label={t.send} disabled={!!busy || !draft.trim() || (!!doc && doc.state !== 'ready')}>{busy ? <LoaderCircle className="spinning" size={20} /> : <ArrowUp size={21} />}</button></div>
          </form>
          <p className="agent-muted agent-file-hint">{t.fileHint}</p><p className="agent-muted agent-privacy">{t.privacy}</p>
        </div>
      </section>
    </div>}
    {reading && user && <section className="document-reader" role="dialog" aria-modal="true" aria-label={reading.name} style={{ '--document-font': `${fontSize}px` } as CSSProperties}>
      <header><button type="button" onClick={() => setReading(null)} aria-label={t.close}><ArrowLeft size={20} /></button><strong>{reading.name}</strong><button type="button" onClick={() => setFontSize(n => Math.max(18, n - 2))} aria-label={t.smaller}>A−</button><button type="button" onClick={() => setFontSize(n => Math.min(30, n + 2))} aria-label={t.bigger}>A+</button></header>
      <article><DocumentContent key={reading.id} document={reading} preparing={t.preparing} failed={t.renderFailed} /></article>
      <footer><button type="button" onClick={() => { choose(reading.id); setReading(null); composer.current?.focus() }}>{t.chat}</button></footer>
    </section>}
    {cloudConsent && <div className="agent-modal-backdrop"><section className="agent-modal" role="dialog" aria-modal="true" aria-label={t.consentTitle}>
      <h2>{t.consentTitle}</h2><p>{t.consentBody}</p><p><a href="https://lachlan.lazying.art/Bunko/privacy.html" target="_blank" rel="noopener noreferrer">{t.privacyLink}</a></p>
      <button type="button" onClick={() => { setCloudConsent(false); pendingCloud.current = null }}>{t.cancel}</button>
      <button type="button" onClick={() => {
        try { localStorage.setItem(`bunko-cloud-consent-v1:${user?.id}`, 'yes') } catch { /* Consent applies to this action only. */ }
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
