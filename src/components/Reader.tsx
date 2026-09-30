import { htmlLanguage, languageDirection, unitLine } from '../lib/languages'
/**
 * The reading screen.
 *
 * One chapter at a time, because that is also the unit the app downloads. The
 * three arrangements come from the same data: the source line alone, every
 * gloss under its own source line, or whole paragraphs one after another.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, List, MessageCircle, Settings2, Watch } from 'lucide-react'
import type { BookMeta, Chapter, LangCode, ReadingSettings, Unit } from '../types'
import type { UICopy, UILanguage } from '../i18n'
import { languageName } from '../i18n'
import { loadChapter } from '../lib/library'
import { Line } from './Line'
import { RichLine } from './RichLine'
import { BookFigure } from './BookFigure'
import { plainText } from '../lib/text'
import { passageKey } from '../lib/readingTools'
import { ReadingPanel, type ReadingFocus } from './ReadingPanel'
import { SelectionTools } from './SelectionTools'
import type { ReaderSelection } from '../lib/readerSelection'
import { supportsWatch, watchExcerpt, sendToWatch } from '../lib/watchReading'

interface ReaderProps {
  meta: BookMeta
  chapterIndex: number
  settings: ReadingSettings
  copy: UICopy
  ui: UILanguage
  onChapter: (index: number) => void
  onPlace: (paragraph: number) => void
  startParagraph: number
  onOpenChapters: () => void
  onOpenSettings: () => void
  onBack: () => void
  backLabel: string
  overlayOpen?: boolean
}

function PassageNotes({ enabled, label, children }: { enabled: boolean; label: string; children: ReactNode }) {
  return enabled ? <details className="passage-notes"><summary>{label}</summary>{children}</details> : children
}

export function Reader({
  meta,
  chapterIndex,
  settings,
  copy,
  ui,
  onChapter,
  onPlace,
  startParagraph,
  onOpenChapters,
  onOpenSettings,
  onBack,
  backLabel,
  overlayOpen = false,
}: ReaderProps) {
  const [loaded, setLoaded] = useState<{ file: string; chapter: Chapter | null; error: string }>({
    file: '',
    chapter: null,
    error: '',
  })
  const [progress, setProgress] = useState(0)
  const [watchStatus, setWatchStatus] = useState('')
  const [watchBusy, setWatchBusy] = useState(false)
  const visibleParagraph = useRef(startParagraph)
  const [focus, setFocus] = useState<ReadingFocus | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const row = meta.chapters[chapterIndex]
  // Anything not matching the chapter now on screen is a stale load.
  const chapter = loaded.file === row?.file ? loaded.chapter : null
  const error = loaded.file === row?.file ? loaded.error : ''
  const activeFocus = focus?.key.startsWith(`${meta.id}/${row?.file}/`) ? focus : null

  const langs = useMemo(
    () => settings.langs.filter((lang) => meta.langs.includes(lang)),
    [settings.langs, meta.langs],
  )
  const shown: LangCode[] = settings.layout === 'source' ? [meta.primary] : langs.length ? langs : [meta.primary]

  useEffect(() => {
    if (!row) return
    visibleParagraph.current = startParagraph
    let cancelled = false
    const controller = new AbortController()
    loadChapter(meta.id, row.file, controller.signal)
      .then((next) => {
        if (!cancelled) setLoaded({ file: row.file, chapter: next, error: '' })
      })
      .catch((caught: unknown) => {
        if (cancelled || controller.signal.aborted) return
        setLoaded({ file: row.file, chapter: null, error: caught instanceof Error ? caught.message : String(caught) })
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  // startParagraph is read when a chapter changes, not while scrolling it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.id, row])

  // Restore the reader's place once, when the chapter arrives. Reading then
  // updates the stored place, and this must not turn that into a scroll loop,
  // so the starting paragraph is read from a ref rather than followed.
  const startRef = useRef(startParagraph)
  useEffect(() => {
    startRef.current = startParagraph
  })
  useEffect(() => {
    if (!chapter) return
    const host = scrollRef.current
    if (!host) return
    const target = host.querySelector<HTMLElement>(`[data-para="${startRef.current}"]`)
    host.scrollTo({ top: target ? target.offsetTop - 12 : 0, behavior: 'auto' })
  }, [chapter])

  const handleScroll = useCallback(() => {
    const host = scrollRef.current
    if (!host || !chapter) return
    const span = host.scrollHeight - host.clientHeight
    setProgress(span > 0 ? Math.min(1, host.scrollTop / span) : 1)
    const paragraphs = host.querySelectorAll<HTMLElement>('[data-para]')
    for (let index = paragraphs.length - 1; index >= 0; index -= 1) {
      if (paragraphs[index].offsetTop <= host.scrollTop + 40) {
        onPlace(Number(paragraphs[index].dataset.para))
        visibleParagraph.current = Number(paragraphs[index].dataset.para)
        return
      }
    }
    onPlace(0)
    visibleParagraph.current = 0
  }, [chapter, onPlace])

  const title =
    plainText(chapter?.title?.[shown[0]] ?? chapter?.title?.[meta.primary]) ||
    row?.title?.[meta.primary] ||
    `${copy.chapterList} ${row?.n ?? ''}`
  const discussLabel = { en: 'Discuss passage', 'zh-Hans': '讨论这段', 'zh-Hant': '討論這段', ja: 'この箇所を話し合う' }[ui]
  const notesLabel = { en: 'Translation notes', 'zh-Hans': '译注', 'zh-Hant': '譯注', ja: '訳注' }[ui]
  const watchLabel = { en: 'Send excerpt to Apple Watch', 'zh-Hans': '发送选段到 Apple Watch', 'zh-Hant': '傳送選段到 Apple Watch', ja: '抜粋をApple Watchへ送る' }[ui]
  const watchQueued = { en: 'Excerpt queued. Open Bunko on your paired Apple Watch to read it offline.', 'zh-Hans': '选段已排队。在配对的 Apple Watch 上打开 Bunko，即可离线阅读。', 'zh-Hant': '選段已排隊。在配對的 Apple Watch 上開啟 Bunko，即可離線閱讀。', ja: '抜粋を送信待ちにしました。ペアリングしたApple WatchのBunkoでオフライン閲覧できます。' }[ui]

  const openFocus = (paragraphId: string, unit: Unit, unitIndex: number, lang: LangCode, word?: string, reading?: string) => {
    window.getSelection()?.removeAllRanges()
    setFocus({ key: passageKey(meta, row.file, paragraphId, unitIndex), unit, lang, word, reading })
  }

  const openSelection = (selection: ReaderSelection, dictionary: boolean) => {
    const { readingPara: para, unit: unitIndex, lang } = selection.passage.dataset
    const paragraph = chapter?.p[Number(para)]
    const unit = paragraph?.u[Number(unitIndex)]
    if (paragraph && unit && lang) openFocus(paragraph.id, unit, Number(unitIndex), lang as LangCode, dictionary ? selection.text : undefined)
  }


  return (
    <div className="reader" data-book-id={meta.id} data-chapter={chapterIndex}>
      <header className="reader-bar">
        <button type="button" onClick={onBack} aria-label={backLabel}>
          <ChevronLeft size={20} />
        </button>
        <button type="button" className="reader-bar-title" onClick={onOpenChapters} aria-label={copy.chapterList}>
          <strong>{title}</strong>
          <small>
            <List size={11} /> {meta.titleText[meta.primary] ?? meta.id}
          </small>
        </button>
        {supportsWatch() && <button type="button" disabled={!chapter || watchBusy} aria-label={watchLabel} onClick={async () => {
          if (!chapter) return
          setWatchBusy(true)
          try { await sendToWatch(watchExcerpt(meta, chapter, shown, visibleParagraph.current)); setWatchStatus(watchQueued) }
          catch (error) { setWatchStatus(error instanceof Error ? error.message : String(error)) }
          finally { setWatchBusy(false) }
        }}><Watch size={18} /></button>}
        <button type="button" onClick={onOpenSettings} aria-label={copy.settings}>
          <Settings2 size={18} />
        </button>
      </header>
      {watchStatus && <p className="notice" role="status" onClick={() => setWatchStatus('')}>{watchStatus}</p>}
      <div className="reader-progress" aria-hidden="true">
        <i style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      <div
        className={`page layout-${settings.layout}${settings.serif ? ' serif' : ''}`}
        style={{ fontSize: `${settings.fontScale}rem`, '--ruby-size': `${settings.rubyScale * .52}rem` } as CSSProperties}
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {error && (
          <p className="notice error">
            {copy.offlineError}
            <small>{error}</small>
          </p>
        )}
        {!chapter && !error && <p className="notice">{copy.loading}…</p>}

        {chapter && (
          <article>
            <h1 lang={htmlLanguage(chapter.title?.[shown[0]] ? shown[0] : meta.primary)} dir={languageDirection(chapter.title?.[shown[0]] ? shown[0] : meta.primary)}>
              <Line line={chapter.title?.[shown[0]] ?? chapter.title?.[meta.primary]} ruby={settings.ruby} />
            </h1>
            {chapter.p.map((paragraph, index) => (paragraph.figure || paragraph.u.some(unit => shown.some(lang => unitLine(unit, lang)?.length))) && (
              <div className={`para${paragraph.kind ? ` para-${paragraph.kind}` : ''}`} key={paragraph.id || index} data-para={index}>
                {paragraph.figure && <BookFigure bookId={meta.id} figure={paragraph.figure} lang={shown[0]} primary={meta.primary} />}
                <PassageNotes enabled={paragraph.kind === 'annotation' || (paragraph.id.endsWith('-notes') && paragraph.u.every(unit => unit.annotation === true))} label={notesLabel}>
                {settings.layout === 'paired'
                  ? shown.filter(lang => paragraph.u.some(unit => unitLine(unit, lang)?.length)).map((lang) => (
                      <p className={`para-line lang-${lang}`} key={lang} lang={htmlLanguage(lang)} dir={languageDirection(lang)}>
                        <strong className="language-label">{languageName(lang, ui)}</strong>
                        {paragraph.u.map((unit, unitIndex) => unitLine(unit, lang)?.length ? (
                          <span key={unitIndex} className="paired-unit"><span data-reading="" data-reading-para={index} data-unit={unitIndex} data-lang={lang} lang={htmlLanguage(lang)} dir={languageDirection(lang)}><RichLine unit={unit} lang={lang} ruby={settings.ruby} grammar={settings.grammar} /></span>{lang === shown[0] && <button className="passage-action" type="button" aria-label={discussLabel} onClick={() => openFocus(paragraph.id, unit, unitIndex, lang)}><MessageCircle size={13} /></button>}</span>
                        ) : null)}
                      </p>
                    ))
                  : paragraph.u.map((unit, unitIndex) => (
                      <div className="unit" key={unitIndex}>
                        {shown.map((lang) =>
                          unitLine(unit, lang)?.length ? (
                            <p className={`unit-line lang-${lang}`} key={lang} lang={htmlLanguage(lang)} dir={languageDirection(lang)}>
                              {shown.length > 1 && <strong className="language-label">{languageName(lang, ui)}</strong>}
                              <span data-reading="" data-reading-para={index} data-unit={unitIndex} data-lang={lang} lang={htmlLanguage(lang)} dir={languageDirection(lang)}><RichLine
                                unit={unit}
                                lang={lang}
                                ruby={settings.ruby}
                                grammar={settings.grammar}
                              /></span>
                              {lang === shown[0] && <button className="passage-action" type="button" aria-label={discussLabel} onClick={() => openFocus(paragraph.id, unit, unitIndex, lang)}><MessageCircle size={13} /></button>}
                            </p>
                          ) : null,
                        )}
                      </div>
                    ))}
                </PassageNotes>
              </div>
            ))}
            <nav className="chapter-nav">
              <button type="button" disabled={chapterIndex <= 0} onClick={() => { setFocus(null); onChapter(chapterIndex - 1) }}>
                <ChevronLeft size={16} /> {copy.previous}
              </button>
              <span>
                {row?.n} / {meta.chapters.length}
              </span>
              <button
                type="button"
                disabled={chapterIndex >= meta.chapters.length - 1}
                onClick={() => { setFocus(null); onChapter(chapterIndex + 1) }}
              >
                {copy.next} <ChevronRight size={16} />
              </button>
            </nav>
            {chapterIndex >= meta.chapters.length - 1 && <p className="notice">{copy.finished}</p>}
          </article>
        )}
      </div>
      {chapter && !activeFocus && !overlayOpen && <SelectionTools key={`${row.file}:${settings.layout}:${shown.join(',')}`} host={scrollRef} ui={ui} onOpen={openSelection} />}
      {activeFocus && <ReadingPanel key={`${activeFocus.key}:${activeFocus.word ?? ''}:${activeFocus.lang}`} focus={activeFocus} ui={ui} onClose={() => setFocus(null)} />}
    </div>
  )
}
