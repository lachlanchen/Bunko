import { useEffect, useRef, useState } from 'react'
import { Download, Mail } from 'lucide-react'
import type { BookMeta, ReadingSettings } from '../types'
import { copies, type UILanguage } from '../i18n'
import { EPUB_MAIL_MAX_BYTES, epubLanguages } from '../lib/epubOptions'
import { restoreSession } from '../lib/discussions'
import { kindleMailRequest, kindleMailStatus, saveEpub, sendEpubToKindle } from '../lib/epubDelivery'
import { LanguageChoices } from './LanguageChoices'
import { Sheet } from './Sheet'
import { epubCopy } from '../lib/epubCopy'
import { chineseReadingOptions } from '../lib/chineseEdition'

export function BookExport({ book, settings, ui, onClose }: {
  book: BookMeta; settings: ReadingSettings; ui: UILanguage; onClose: () => void
}) {
  const copy = epubCopy[ui], reader = copies[ui]
  const [langs, setLangs] = useState(() => epubLanguages(book, settings))
  const [layout, setLayout] = useState<'interlinear' | 'paired'>(() => settings.layout === 'paired' ? 'paired' : 'interlinear')
  const [ruby, setRuby] = useState(settings.ruby)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [sender, setSender] = useState('')
  const [mailReady, setMailReady] = useState<boolean | null>(null)
  const [offered, setOffered] = useState(false)
  const [sent, setSent] = useState(false)
  const exportJob = useRef<AbortController | null>(null)
  const sendId = useRef<{ recipient: string; id: string } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void restoreSession().catch(() => {}).then(() => {
      if (controller.signal.aborted) return
      return kindleMailStatus(controller.signal).then(state => {
        if (controller.signal.aborted) return
        setOffered(state.enabled)
        setMailReady(state.enabled && state.signedIn)
        if (state.sender) setSender(state.sender)
      }).catch(() => { if (!controller.signal.aborted) setMailReady(false) })
    })
    return () => { controller.abort(); exportJob.current?.abort() }
  }, [])
  function change(action: () => void) {
    action()
    setFile(null)
    setStatus('')
    setSent(false)
    sendId.current = null
  }
  async function prepare() {
    const job = new AbortController()
    exportJob.current = job
    setBusy(true)
    setStatus('')
    try {
      const { createEpub } = await import('../lib/epub')
      const result = await createEpub(book, { langs, layout, ruby }, { signal: job.signal,
        onProgress: (done, total) => setProgress(`${done} / ${total}`) })
      if (!job.signal.aborted) { setFile(result); setStatus(copy.ready) }
    } catch {
      if (!job.signal.aborted) setStatus(copy.failed)
    } finally {
      if (!job.signal.aborted) { setProgress(''); setBusy(false) }
    }
  }
  async function send() {
    if (!file) return
    const address = recipient.trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9._+-]{0,63}@kindle\.com$/.test(address)) { setStatus(copy.addressInvalid); return }
    if (file.size > EPUB_MAIL_MAX_BYTES) { setStatus(copy.tooLarge); return }
    if (sendId.current?.recipient !== address) sendId.current = { recipient: address, id: kindleMailRequest() }
    setBusy(true)
    setStatus('')
    try {
      await sendEpubToKindle(file, address, sendId.current.id)
      setSent(true)
      setStatus(copy.sent)
    } catch (error) {
      const code = (error as { code?: string })?.code
      setStatus(code === 'kindle_rate_limited' ? copy.limited : code === 'sign_in_again' ? copy.signedOut : copy.sendFailed)
    } finally { setBusy(false) }
  }
  return <Sheet title={copy.title} closeLabel={reader.close} onClose={onClose}>
    <section>
      <h3>{copy.languages}</h3>
      <fieldset disabled={busy} className="epub-choices">
        <LanguageChoices available={chineseReadingOptions(book.langs)} selected={langs} ui={ui} onChange={value => change(() => setLangs(value))} />
        <div className="chips">
          <button type="button" aria-pressed={layout === 'interlinear'} className={layout === 'interlinear' ? 'active' : ''} onClick={() => change(() => setLayout('interlinear'))}>{reader.layoutInterlinear}</button>
          <button type="button" aria-pressed={layout === 'paired'} className={layout === 'paired' ? 'active' : ''} onClick={() => change(() => setLayout('paired'))}>{reader.layoutPaired}</button>
        </div>
        <label className="epub-ruby"><input type="checkbox" checked={ruby} onChange={event => change(() => setRuby(event.target.checked))} /> {reader.ruby}</label>
      </fieldset>
    </section>
    <section>
      <p className="hint">{copy.local}</p>
      <div className="actions">
        {!file && <button className="primary" disabled={busy} type="button" onClick={() => void prepare()}>{copy.prepare}{progress ? ` · ${progress}` : ''}</button>}
        {file && <button className="primary" disabled={busy} type="button" onClick={() => { setBusy(true); void saveEpub(file).catch(() => setStatus(copy.saveFailed)).finally(() => setBusy(false)) }}><Download size={17} />{copy.save}</button>}
      </div>
      {file && !offered && mailReady === false && <p className="hint">{copy.unavailable} <a href="https://www.amazon.com/sendtokindle" target="_blank" rel="noreferrer">{copy.send} ↗</a></p>}
    </section>
    {file && offered && <section>
      {file.size > EPUB_MAIL_MAX_BYTES ? <p className="hint">{copy.tooLarge}</p> : mailReady ?
        <form className="epub-mail" onSubmit={event => { event.preventDefault(); void send() }}>
          <label>{copy.address}<input type="email" value={recipient} placeholder="name@kindle.com" required autoComplete="off" disabled={busy}
            onChange={event => { setRecipient(event.target.value); setSent(false) }} /></label>
          <p className="hint">{copy.sender.replace('{sender}', sender)}</p>
          <button type="submit" disabled={busy || sent || !recipient.trim()}><Mail size={17} />{copy.send}</button>
        </form> : <p className="hint">{copy.signedOut}</p>}
    </section>}
    <p className="hint" role="status" aria-live="polite">{status || progress}</p>
  </Sheet>
}
