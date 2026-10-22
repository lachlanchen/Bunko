import { useEffect, useState } from 'react'
import type { BookMeta, Chapter, ReaderIndex } from '../types'
import type { BookReference } from '../lib/bookCompanion'
import { loadChapter, loadIndex, loadMeta } from '../lib/library'
import type { UILanguage } from '../i18n'
import { Sheet } from './Sheet'

import { bookCompanionCopy } from './bookCompanionCopy'
import { referenceCopy } from './bookReferenceCopy'

const plain = (line: unknown): string => Array.isArray(line) ? line.map(t => typeof t === 'string' ? t : Array.isArray(t) ? String(t[0] || '') : '').join('') : ''
export function BookReferencePicker({ initial, meta: initialMeta, ui, onClose, onChoose }: {
  initial: BookReference; meta: BookMeta; ui: UILanguage; onClose: () => void; onChoose: (ref: BookReference, meta: BookMeta) => void
}) {
  const t = referenceCopy[ui], [index, setIndex] = useState<ReaderIndex | null>(null), [query, setQuery] = useState('')
  const [id, setId] = useState(initial.id), [meta, setMeta] = useState<BookMeta>(initialMeta)
  const [chapter, setChapter] = useState(initial.chapter), [paragraph, setParagraph] = useState(initial.paragraph)
  const [scope, setScope] = useState<BookReference['scope']>(initial.scope), [language, setLanguage] = useState(initial.language)
  const [loaded, setLoaded] = useState<Chapter | null>(null), [quote, setQuote] = useState(initial.quote || ''), [error, setError] = useState('')
  useEffect(() => { let active = true; void loadIndex().then(v => { if (active) setIndex(v) }).catch(() => {}); return () => { active = false } }, [])
  useEffect(() => {
    let active = true
    if (id !== initialMeta.id) void loadMeta(id).then(v => { if (active) { setMeta(v); setLanguage(v.langs.includes(initial.language) ? initial.language : v.primary) } }).catch(() => { if (active) setError(t.unavailable) })
    return () => { active = false }
  }, [id, initialMeta, initial.language, t.unavailable])
  const file = meta.id === id ? meta.chapters[chapter]?.file : undefined
  useEffect(() => {
    const controller = new AbortController()
    if (file) void loadChapter(id, file, controller.signal).then(v => { if (!controller.signal.aborted) setLoaded(v) }).catch(() => { if (!controller.signal.aborted) setError(t.unavailable) })
    return () => controller.abort()
  }, [id, file, t.unavailable])
  const text = (loaded?.p[paragraph]?.u || []).map(u => plain(u[language])).filter(Boolean).join('\n')
  const sentences = text ? (typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter(undefined, { granularity: 'sentence' }).segment(text)].map(s => s.segment.trim()) : (text.match(/[^。！？.!?]+[。！？.!?]*\s*/gu) || []).map(s => s.trim())).filter(s => s.length >= 2 && s.length <= 2000) : []
  const matches = index?.books.filter(b => [b.id, ...Object.values(b.title)].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0, 12) || []
  return <Sheet title={t.title} closeLabel={t.close} onClose={onClose}>
    <div className="book-reference-picker">
      <input type="search" value={query} placeholder={t.search} aria-label={t.search} onChange={e => setQuery(e.target.value)} />
      {query && <div className="reference-results">{matches.map(b => <button type="button" key={b.id} onClick={() => { setId(b.id); setChapter(0); setParagraph(0); setLoaded(null); setQuery(''); setQuote(''); setError(''); if (b.id === initialMeta.id) { setMeta(initialMeta); setLanguage(initial.language) } }}>{b.title[ui] || b.title[b.primary] || b.id}</button>)}</div>}
      <strong dir="auto">{meta.id === id ? meta.titleText[language] || meta.titleText[meta.primary] : id}</strong>
      <label>{t.selected}<select aria-label={t.selected} value={scope} onChange={e => { const next = e.target.value as BookReference['scope']; setScope(next); if (next === 'chapter') setParagraph(0) }}>
        <option value="passage">{t.current}</option><option value="book">{t.whole}</option><option value="chapter">{t.chapter}</option><option value="paragraph">{t.paragraph}</option><option value="sentence">{t.sentence}</option>
      </select></label>
      <label>{t.chapter}<select aria-label={t.chapter} disabled={meta.id !== id} value={chapter} onChange={e => { setChapter(Number(e.target.value)); setParagraph(0); setLoaded(null); setQuote('') }}>
        {meta.chapters.map((c, i) => <option key={c.file} value={i}>{c.n} · {String(c.title[language] || c.title[meta.primary] || '').slice(0, 90)}{String(c.title[language] || c.title[meta.primary] || '').length > 90 ? '…' : ''}</option>)}
      </select></label>
      <details className="reference-title-details"><summary>{bookCompanionCopy[ui].details}</summary><p dir="auto">{meta.chapters[chapter]?.title[language] || meta.chapters[chapter]?.title[meta.primary]}</p></details>
      {!['book', 'chapter'].includes(scope) && <label>{t.paragraph}<input aria-label={t.paragraph} type="number" min={1} max={meta.chapters[chapter]?.paras || 1} value={paragraph + 1} onChange={e => { setParagraph(Math.max(0, Math.min((meta.chapters[chapter]?.paras || 1) - 1, Number(e.target.value) - 1))); setQuote('') }} /></label>}
      {scope === 'sentence' ? <div className="reference-sentences">{sentences.map((s, i) => <button type="button" key={i} aria-pressed={quote === s} onClick={() => setQuote(s)}>{s}</button>)}</div> : <p className="reference-preview" dir="auto">{text.slice(0, 500)}</p>}
      {['book', 'chapter'].includes(scope) && <p className="agent-muted">{t.spoilers}</p>}
      {error && <p role="alert">{error}</p>}
      <button type="button" disabled={!file || !loaded || (!['book', 'chapter'].includes(scope) && !text) || (scope === 'sentence' && !sentences.includes(quote))} onClick={() => onChoose({ id, file: file!, chapter, paragraph, scope, language, replyLanguage: ui, ...(scope === 'sentence' ? { quote } : {}) }, meta)}>{t.choose}</button>
    </div>
  </Sheet>
}
