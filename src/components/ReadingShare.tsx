import shareCopy from '../share-locales.json'
import type { UILanguage } from '../i18n'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BookMarked, Copy, Download, Image, Lightbulb, Link, MessageCircle, Share2, X } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { loadBookImage } from '../lib/bookAssets'
import { htmlLanguage, languageDirection } from '../lib/languages'
import { deliverBookCard } from '../lib/shareFile'
import type { BookShareImage } from '../lib/bookShareImage'
import './reading-share.css'

type ShareAction = 'link' | 'image' | 'saveImage' | 'copy' | 'echo' | 'save' | 'ideas'

export function ReadingShare({ title, titleLanguage, author, cover, url, app = 'Bunko', ui = 'en', translate }:
  BookShareImage & { app?: string; ui?: UILanguage; translate?: (key: string) => string }) {
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [preview, setPreview] = useState<{ key: string; image: string; file?: File; failed?: boolean }>()
  const [busy, setBusy] = useState(false)
  const t = translate || ((key: string) => (shareCopy[ui] as Record<string, string>)[key] || key)
  const panel = useRef<HTMLElement>(null)
  const key = `${url}\n${title}`
  const shown = preview?.key === key ? preview : undefined
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => { document.body.style.overflow = overflow; previous?.focus() }
  }, [open])
  useEffect(() => {
    if (!open) return
    let current = true, art = ''
    async function prepare() {
      let image: HTMLImageElement | null = null
      if (cover) {
        try {
          const blob = await (await loadBookImage(cover)).blob()
          if (!current) return
          art = URL.createObjectURL(blob)
          image = new window.Image()
          image.src = art
          await image.decode()
        } catch { image = null }
      }
      if (!current) return
      setPreview({ key, image: image ? art : '' })
      const { createBookShareImage } = await import('../lib/bookShareImage')
      const file = await createBookShareImage({ title, titleLanguage, author, url }, image)
      if (current) setPreview({ key, image: image ? art : '', file })
    }
    void prepare().catch(() => { if (current) setPreview({ key, image: '', failed: true }) })
    return () => { current = false; if (art) URL.revokeObjectURL(art) }
  }, [open, key, cover, title, titleLanguage, author, url])

  const text = title + '\n' + url
  async function action(kind: ShareAction) {
    setBusy(true)
    setNotice('')
    try {
      if (kind === 'link') {
        if (window.__BUNKO_DESKTOP__ && window.webkit?.messageHandlers?.bunkoAuth) {
          await window.webkit.messageHandlers.bunkoAuth.postMessage({ share: { title, url } })
        } else if (Capacitor.isNativePlatform()) {
          await Share.share({ title, text: title, url, dialogTitle: t('Share') })
        } else if (navigator.share) {
          await navigator.share({ title, text: title, url })
        } else {
          await navigator.clipboard.writeText(url)
          setNotice(t('Link copied. Paste it into your chat.'))
          return
        }
        setOpen(false)
      } else if (kind === 'image' || kind === 'saveImage') {
        if (!shown?.file) return
        if (await deliverBookCard(shown.file, kind === 'saveImage')) setNotice(t('Card saved'))
      } else if (kind === 'copy') {
        await navigator.clipboard.writeText(url)
        setNotice(t('Copied'))
      } else if (kind === 'echo') {
        await navigator.clipboard.writeText(text)
        setNotice(t('Copied. Paste into EchoMind to choose who to send it to.'))
      } else {
        const lead = t(kind === 'save' ? 'Save this to my reading list:' : 'Help me explore research ideas from:')
        await navigator.clipboard.writeText(lead + '\n' + text)
        setNotice(t('Copied. Paste into AiMemo and review before sending.'))
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setNotice(t('Could not share. Try copying the link.'))
    } finally { setBusy(false) }
  }

  return <>
    <button className="reading-share-trigger" type="button" onClick={() => { setOpen(true); setNotice('') }} aria-label={t('Share')}>
      <Share2 size={17} /><span>{t('Share')}</span>
    </button>
    {open && createPortal(<div className="reading-share-backdrop" onClick={event => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section ref={panel} className="reading-share" role="dialog" aria-modal="true" aria-label={t('Share')} onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          setOpen(false)
        }
        if (event.key === 'Tab') {
          const buttons = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || [])
          const first = buttons[0], last = buttons.at(-1)
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        }
      }}>
        <header><strong>{t('Share')}</strong><button type="button" aria-label={t('Close')} onClick={() => setOpen(false)}><X size={20} /></button></header>
        <div className="reading-share-card">
          <img className={shown?.image ? 'share-cover' : ''} src={shown?.image || './icon-512.png'} alt="" />
          <span><small>{app}</small><strong lang={htmlLanguage(titleLanguage || ui)} dir={languageDirection(titleLanguage || ui)}>{title}</strong>
            {author && <small dir="auto">{author}</small>}
          </span>
        </div>
        <div className="reading-share-options featured">
          <button type="button" disabled={busy} onClick={() => void action('link')}><Link size={20} /><span>{t('Share link')}<small>{t('WeChat and other chats')}</small></span></button>
          <button type="button" disabled={busy || !shown?.file} onClick={() => void action('image')}><Image size={20} /><span>{t('Share image')}<small>{t('Instagram and Stories')}</small></span></button>
          <button type="button" disabled={busy || !shown?.file} onClick={() => void action('saveImage')}><Download size={20} />{t('Save card')}</button>
          <button type="button" disabled={busy} onClick={() => void action('copy')}><Copy size={20} />{t('Copy link')}</button>
        </div>
        <div className="reading-share-options">
          <button type="button" disabled={busy} onClick={() => void action('echo')}><MessageCircle size={20} />{t('Copy for EchoMind')}</button>
          <button type="button" disabled={busy} onClick={() => void action('save')}><BookMarked size={20} />{t('AiMemo · save to read later')}</button>
          <button type="button" disabled={busy} onClick={() => void action('ideas')}><Lightbulb size={20} />{t('AiMemo · explore ideas')}</button>
        </div>
        <p role="status">{notice || (shown?.failed ? t('Could not prepare the card.') : !shown?.file ? t('Preparing card…') : '')}</p>
      </section>
    </div>, document.body)}
  </>
}
