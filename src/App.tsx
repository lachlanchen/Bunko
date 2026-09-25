import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Check, Download, Settings, RefreshCw, Search, Trash2, X } from 'lucide-react'
import type { BookMeta, BookRow, LangCode, Place, ReaderIndex, ReadingSettings } from './types'
import { copies, languageName, uiLanguageNames, type UILanguage } from './i18n'
import {
  cachedBookCounts,
  subscribeIndex,
  downloadBook,
  downloadedChapterCount,
  issueUrl,
  loadIndex,
  loadMeta,
  removeBook,
  storageEstimate,
} from './lib/library'
import {
  DEFAULT_SETTINGS,
  defaultLangsFor,
  loadPlaces,
  loadSettings,
  loadUI,
  savePlace,
  saveSettings,
  saveUI,
} from './lib/settings'
import { Reader } from './components/Reader'
import { Cover } from './components/Cover'

type View = 'library' | 'book' | 'reader'
type Filter = 'all' | 'chinese' | 'japanese' | 'world' | 'physics' | 'learning' | 'finance' | 'travel' | 'device'

/** Which shelf a book belongs on, from its id and mode. */
function categoryOf(book: BookRow): Filter {
  if ((book as BookRow & { cat?: string }).cat) {
    return (book as BookRow & { cat?: string }).cat as Filter
  }
  if (book.mode.startsWith('quadrilingual') || book.mode === 'wenyan_ja_zh') return 'chinese'
  return 'world'
}

export default function App() {
  const [ui, setUI] = useState<UILanguage>('en')
  const [settings, setSettings] = useState<ReadingSettings>(DEFAULT_SETTINGS)
  const [index, setIndex] = useState<ReaderIndex | null>(null)
  const [indexError, setIndexError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [bookError, setBookError] = useState('')
  const [view, setView] = useState<View>('library')
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [meta, setMeta] = useState<BookMeta | null>(null)
  const [places, setPlaces] = useState<Record<string, Place>>({})
  const [chapterIndex, setChapterIndex] = useState(0)
  const [onDevice, setOnDevice] = useState<Record<string, number>>({})
  const [downloading, setDownloading] = useState<{ id: string; done: number; total: number } | null>(null)
  const [showChapters, setShowChapters] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null)
  const [request, setRequest] = useState('')
  const downloadRef = useRef<AbortController | null>(null)
  const copy = copies[ui]

  useEffect(() => {
    void (async () => {
      const [uiState, saved, savedPlaces] = await Promise.all([loadUI(), loadSettings(), loadPlaces()])
      setUI(uiState.language)
      setSettings(saved)
      setPlaces(savedPlaces)
    })()
    const unsubscribe = subscribeIndex(setIndex)
    loadIndex()
      .then(setIndex)
      .catch((error: unknown) => setIndexError(error instanceof Error ? error.message : String(error)))
    void storageEstimate().then(setStorage)
    const refresh = () => {
      if (document.visibilityState !== 'hidden') void loadIndex({ refresh: true }).catch(() => {})
    }
    window.addEventListener('online', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      unsubscribe()
      window.removeEventListener('online', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  useEffect(() => {
    if (index) void cachedBookCounts(index.books).then(setOnDevice)
  }, [index])

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    const apply = () => {
      document.documentElement.dataset.theme = settings.theme === 'night' || (settings.theme === 'system' && media?.matches) ? 'night' : 'paper'
    }
    apply()
    media?.addEventListener('change', apply)
    return () => media?.removeEventListener('change', apply)
  }, [settings.theme])

  const update = useCallback((patch: Partial<ReadingSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch }
      void saveSettings(next)
      return next
    })
  }, [])

  const books = useMemo(() => {
    const all = index?.books ?? []
    const text = query.trim().toLowerCase()
    return all.filter((book) => {
      if (filter === 'device' && !onDevice[book.id]) return false
      if (filter !== 'all' && filter !== 'device' && categoryOf(book) !== filter) return false
      if (!text) return true
      const haystack = [book.id, book.author, ...Object.values(book.title)].join(' ').toLowerCase()
      return haystack.includes(text)
    })
  }, [index, filter, query, onDevice])

  const openBook = useCallback(
    async (book: BookRow) => {
      setView('book')
      setMeta(null)
      setBookError('')
      let loaded: BookMeta
      try { loaded = await loadMeta(book.id) } catch { setBookError(copy.offlineError); return }
      setMeta(loaded)
      const count = await downloadedChapterCount(loaded)
      setOnDevice((current) => ({ ...current, [loaded.id]: count }))
      setSettings((current) => {
        if (current.langs.some((lang) => loaded.langs.includes(lang))) return current
        const next = { ...current, langs: defaultLangsFor(loaded.langs, ui) }
        void saveSettings(next)
        return next
      })
    },
    [ui, copy.offlineError],
  )

  const startReading = useCallback(
    (fromStart: boolean) => {
      if (!meta) return
      const place = places[meta.id]
      setChapterIndex(fromStart || !place ? 0 : Math.min(place.chapter, meta.chapters.length - 1))
      setView('reader')
    },
    [meta, places],
  )

  const runDownload = useCallback(async () => {
    if (!meta) return
    downloadRef.current?.abort()
    const controller = new AbortController()
    downloadRef.current = controller
    setBookError('')
    setDownloading({ id: meta.id, done: 0, total: meta.chapters.length })
    try {
      await downloadBook(
        meta.id,
        (done, total) => setDownloading({ id: meta.id, done, total }),
        controller.signal,
      )
      setOnDevice((current) => ({ ...current, [meta.id]: meta.chapters.length }))
      void storageEstimate().then(setStorage)
    } catch {
      if (!controller.signal.aborted) setBookError(copy.offlineError)
      const count = await downloadedChapterCount(meta)
      setOnDevice((current) => ({ ...current, [meta.id]: count }))
    } finally {
      setDownloading(null)
    }
  }, [meta, copy.offlineError])

  const handlePlace = useCallback(
    (paragraph: number) => {
      if (!meta) return
      const place = { chapter: chapterIndex, paragraph }
      setPlaces((current) => {
        const existing = current[meta.id]
        if (existing && existing.chapter === place.chapter && existing.paragraph === place.paragraph) {
          return current
        }
        void savePlace(meta.id, place)
        return { ...current, [meta.id]: place }
      })
    },
    [meta, chapterIndex],
  )

  if (view === 'reader' && meta) {
    return (
      <>
        <Reader
          meta={meta}
          chapterIndex={chapterIndex}
          settings={settings}
          copy={copy}
          ui={ui}
          startParagraph={places[meta.id]?.chapter === chapterIndex ? (places[meta.id]?.paragraph ?? 0) : 0}
          onChapter={(next) => {
            setChapterIndex(next)
            handlePlace(0)
          }}
          onPlace={handlePlace}
          onOpenChapters={() => setShowChapters(true)}
          onOpenSettings={() => setShowSettings(true)}
          onBack={() => setView('book')}
          backLabel={copy.back}
        />
        {showChapters && (
          <Sheet title={copy.chapterList} onClose={() => setShowChapters(false)} closeLabel={copy.close}>
            <ol className="chapter-list">
              {meta.chapters.map((chapter, position) => (
                <li key={chapter.file}>
                  <button
                    type="button"
                    className={position === chapterIndex ? 'active' : ''}
                    onClick={() => {
                      setChapterIndex(position)
                      setShowChapters(false)
                    }}
                  >
                    <span className="chapter-n">{chapter.n}</span>
                    <span className="chapter-title">
                      {chapter.title[meta.primary] ?? Object.values(chapter.title)[0] ?? ''}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </Sheet>
        )}
        {showSettings && (
          <SettingsSheet
            copy={copy}
            ui={ui}
            settings={settings}
            bookLangs={meta.langs}
            onUI={(next) => {
              setUI(next)
              void saveUI({ language: next })
            }}
            onChange={update}
            onClose={() => setShowSettings(false)}
            storage={storage}
            request={request}
            setRequest={setRequest}
          />
        )}
      </>
    )
  }

  if (view === 'book') {
    const row = index?.books.find((book) => book.id === meta?.id)
    return (
      <main className="page-shell">
        <button className="link-back" type="button" onClick={() => setView('library')}>
          ← {copy.library}
        </button>
        {!meta && <p className={`notice${bookError ? ' error' : ''}`}>{bookError || `${copy.loading}…`}</p>}
        {meta && bookError && <p className="notice error" role="status">{bookError}</p>}
        {meta && row && (
          <>
            <section className="book-hero">
              <Cover book={row} />
              <div>
                <h1>{meta.titleText[meta.primary] ?? meta.id}</h1>
                <p className="book-alt">
                  {meta.langs
                    .filter((lang) => lang !== meta.primary && meta.titleText[lang])
                    .map((lang) => meta.titleText[lang])
                    .join(' · ')}
                </p>
                {meta.author?.name && <p className="book-author">{meta.author.name}</p>}
                <p className="book-facts">
                  {meta.chapters.length} {copy.chapters} · {meta.paras.toLocaleString()} {copy.paragraphs} ·{' '}
                  {(meta.bytes / 1e6).toFixed(1)} MB
                </p>
                <p className="book-langs">
                  {meta.langs.map((lang) => (
                    <span key={lang} className="pill">
                      {languageName(lang, ui)}
                    </span>
                  ))}
                </p>
              </div>
            </section>

            <div className="actions">
              <button type="button" className="primary" onClick={() => startReading(!places[meta.id])}>
                <BookOpen size={17} /> {places[meta.id] ? copy.continueReading : copy.start}
              </button>
              {downloading?.id === meta.id ? (
                <button type="button" onClick={() => downloadRef.current?.abort()}>
                  {copy.downloading} {downloading.done}/{downloading.total}
                </button>
              ) : onDevice[meta.id] === meta.chapters.length ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(copy.removeConfirm)) return
                    await removeBook(meta.id)
                    setOnDevice((current) => ({ ...current, [meta.id]: 0 }))
                    void storageEstimate().then(setStorage)
                  }}
                >
                  <Trash2 size={16} /> {copy.remove}
                </button>
              ) : (
                <button type="button" onClick={runDownload}>
                  <Download size={16} /> {copy.download}
                </button>
              )}
            </div>
            {onDevice[meta.id] === meta.chapters.length && (
              <p className="ready">
                <Check size={15} /> {copy.offlineReady}
              </p>
            )}

            <ol className="chapter-list flat">
              {meta.chapters.map((chapter, position) => (
                <li key={chapter.file}>
                  <button
                    type="button"
                    onClick={() => {
                      setChapterIndex(position)
                      setView('reader')
                    }}
                  >
                    <span className="chapter-n">{chapter.n}</span>
                    <span className="chapter-title">
                      {chapter.title[meta.primary] ?? Object.values(chapter.title)[0] ?? ''}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </>
        )}
      </main>
    )
  }

  return (
    <main className="page-shell">
      <header className="masthead">
        <div>
          <h1>{copy.appName}</h1>
          <p>{copy.tagline}</p>
        </div>
        <div className="library-tools">
          <select className="theme-select" aria-label={copy.theme} value={settings.theme} onChange={(event) => update({ theme: event.target.value as ReadingSettings['theme'] })}>
            <option value="paper">☀ {copy.themePaper}</option>
            <option value="night">☾ {copy.themeNight}</option>
            <option value="system">◐ {copy.themeSystem}</option>
          </select>
          <button type="button" className="icon" onClick={() => setShowSettings(true)} aria-label={copy.settings}>
            <Settings size={18} />
          </button>
        </div>
      </header>

      <div className="search">
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
          aria-label={copy.search}
        />
      </div>

      <nav className="chips library-chips" aria-label={copy.library}>
        {(['all', 'chinese', 'japanese', 'world', 'physics', 'learning', 'finance', 'travel', 'device'] as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            className={filter === key ? 'active' : ''}
            onClick={() => setFilter(key)}
          >
            {key === 'all' ? copy.allLanguages : key === 'device' ? copy.onDevice : copy[key]}
          </button>
        ))}
      </nav>

      {indexError && !index && (
        <p className="notice error">
          {copy.offlineError}
          <small>{indexError}</small>
        </p>
      )}
      {!index && !indexError && <p className="notice">{copy.loading}…</p>}

      {index && <div className="library-status">
        <span>{index.count} {copy.books}</span>
        <button type="button" disabled={refreshing} onClick={async () => {
          setRefreshing(true)
          try { setIndex(await loadIndex({ refresh: true })) } finally { setRefreshing(false) }
        }}><RefreshCw size={14} className={refreshing ? 'spinning' : ''} /> {copy.refreshLibrary}</button>
      </div>}
      <section className="grid">
        {books.map((book) => (
          <button key={book.id} type="button" className="card" onClick={() => void openBook(book)}>
            <Cover book={book} />
            <strong>{book.title[book.primary] ?? book.id}</strong>
            <small>{book.author}</small>
            <em>
              {book.chapters} {copy.chapters}
              {onDevice[book.id] ? ` · ${copy.downloaded}` : ''}
            </em>
          </button>
        ))}
      </section>
      {index && !books.length && <p className="notice">{copy.noResults}</p>}

      {showSettings && (
        <SettingsSheet
          copy={copy}
          ui={ui}
          settings={settings}
          bookLangs={meta?.langs}
          onUI={(next) => {
            setUI(next)
            void saveUI({ language: next })
          }}
          onChange={update}
          onClose={() => setShowSettings(false)}
          storage={storage}
          request={request}
          setRequest={setRequest}
        />
      )}
    </main>
  )
}

function Sheet({
  title,
  onClose,
  closeLabel,
  children,
}: {
  title: string
  onClose: () => void
  closeLabel: string
  children: React.ReactNode
}) {
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet">
        <header>
          <strong>{title}</strong>
          <button type="button" onClick={onClose} aria-label={closeLabel}>
            <X size={18} />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

function SettingsSheet({
  copy,
  ui,
  settings,
  bookLangs,
  onUI,
  onChange,
  onClose,
  storage,
  request,
  setRequest,
}: {
  copy: import('./i18n').UICopy
  ui: UILanguage
  settings: ReadingSettings
  bookLangs?: LangCode[]
  onUI: (next: UILanguage) => void
  onChange: (patch: Partial<ReadingSettings>) => void
  onClose: () => void
  storage: { usage: number; quota: number } | null
  request: string
  setRequest: (value: string) => void
}) {
  const langs = bookLangs ?? []
  return (
    <Sheet title={copy.settings} onClose={onClose} closeLabel={copy.close}>
      {langs.length > 0 && (
        <section>
          <h3>{copy.show}</h3>
          <div className="chips">
            {langs.map((lang) => {
              const on = settings.langs.includes(lang)
              return (
                <button
                  key={lang}
                  type="button"
                  className={on ? 'active' : ''}
                  onClick={() => {
                    const next = on
                      ? settings.langs.filter((item) => item !== lang)
                      : [...settings.langs, lang].sort(
                          (a, b) => langs.indexOf(a) - langs.indexOf(b),
                        )
                    onChange({ langs: next.length ? next : [langs[0]] })
                  }}
                >
                  {languageName(lang, ui)}
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <h3>{copy.layout}</h3>
        <div className="chips">
          {(['source', 'interlinear', 'paired'] as const).map((layout) => (
            <button
              key={layout}
              type="button"
              className={settings.layout === layout ? 'active' : ''}
              onClick={() => onChange({ layout })}
            >
              {layout === 'source'
                ? copy.layoutSource
                : layout === 'interlinear'
                  ? copy.layoutInterlinear
                  : copy.layoutPaired}
            </button>
          ))}
        </div>
      </section>

      <Toggle label={copy.ruby} hint={copy.rubyHint} on={settings.ruby} onChange={(ruby) => onChange({ ruby })} />
      <Toggle
        label={copy.grammar}
        hint={copy.grammarHint}
        on={settings.grammar}
        onChange={(grammar) => onChange({ grammar })}
      />
      <Toggle label={copy.serif} on={settings.serif} onChange={(serif) => onChange({ serif })} />

      <section>
        <h3>{copy.textSize}</h3>
        <input
          type="range"
          min={0.85}
          max={1.6}
          step={0.05}
          value={settings.fontScale}
          onChange={(event) => onChange({ fontScale: Number(event.target.value) })}
        />
      </section>

      <section>
        <h3>{copy.theme}</h3>
        <div className="chips">
          {(['paper', 'night', 'system'] as const).map((theme) => (
            <button
              key={theme}
              type="button"
              className={settings.theme === theme ? 'active' : ''}
              onClick={() => onChange({ theme })}
            >
              {theme === 'paper' ? copy.themePaper : theme === 'night' ? copy.themeNight : copy.themeSystem}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>{copy.interfaceLanguage}</h3>
        <div className="chips">
          {(Object.keys(uiLanguageNames) as UILanguage[]).map((code) => (
            <button key={code} type="button" className={ui === code ? 'active' : ''} onClick={() => onUI(code)}>
              {uiLanguageNames[code]}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>{copy.requestBook}</h3>
        <p className="hint">{copy.requestHint}</p>
        <div className="request">
          <input
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            placeholder={copy.requestPlaceholder}
          />
          <a
            className="button"
            href={issueUrl(request || '')}
            target="_blank"
            rel="noreferrer noopener"
            aria-disabled={!request.trim()}
          >
            {copy.requestSend}
          </a>
        </div>
      </section>

      {storage && (
        <section>
          <h3>{copy.storage}</h3>
          <p className="hint">
            {(storage.usage / 1e6).toFixed(1)} MB {copy.storageUsed}
          </p>
        </section>
      )}

      <section>
        <h3>{copy.about}</h3>
        <p className="hint">{copy.aboutBody}</p>
        <h3>{copy.rights}</h3>
        <p className="hint">{copy.rightsBody}</p>
        <h3>{copy.dictionarySources}</h3>
        <p className="hint"><a href="https://en-word.net/downloads" target="_blank" rel="noopener noreferrer">Open English WordNet 2025</a> (CC BY 4.0) · <a href="https://www.mdbg.net/chinese/dictionary?page=cc-cedict" target="_blank" rel="noopener noreferrer">CC-CEDICT / MDBG</a> (CC BY-SA 4.0) · <a href="https://www.edrdg.org/edrdg/licence.html" target="_blank" rel="noopener noreferrer">JMdict / EDRDG</a> (CC BY-SA 4.0)</p>
      </section>
    </Sheet>
  )
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string
  hint?: string
  on: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <section className="toggle">
      <label>
        <input type="checkbox" checked={on} onChange={(event) => onChange(event.target.checked)} />
        <span>{label}</span>
      </label>
      {hint && <p className="hint">{hint}</p>}
    </section>
  )
}
