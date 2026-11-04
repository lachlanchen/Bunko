import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { BookMeta } from '../types'
import type { UILanguage } from '../i18n'
import { baseLanguage, htmlLanguage, languageDirection } from '../lib/languages'
import { bookCompanionCopy } from './bookCompanionCopy'

export function ChapterRow({ chapter, primary, ui, active, onRead }: {
  chapter: BookMeta['chapters'][number]; primary: string; ui: UILanguage; active?: boolean; onRead: () => void
}) {
  const [expanded, setExpanded] = useState(false), [overflow, setOverflow] = useState(false)
  const label = useRef<HTMLSpanElement>(null)
  const title = chapter.title[primary] ?? Object.values(chapter.title)[0] ?? ''
  const translation = Object.entries(chapter.title).find(([lang, text]) => lang !== primary && baseLanguage(lang) === baseLanguage(ui) && text && text !== title)
  useEffect(() => {
    const measure = () => { if (!expanded && label.current) setOverflow([...label.current.children].some(el => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) }
    const frame = requestAnimationFrame(measure)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (label.current) observer?.observe(label.current)
    return () => { cancelAnimationFrame(frame); observer?.disconnect() }
  }, [title, expanded])
  return <li className={`chapter-row${expanded ? ' expanded' : ''}`}>
    <button type="button" className={active ? 'active' : ''} onClick={onRead} title={title}>
      <span className="chapter-n">{chapter.n}</span>
      <span ref={label} className="chapter-title">
        <bdi lang={htmlLanguage(primary)} dir={languageDirection(primary)}>{title}</bdi>
        {expanded && translation && <small lang={htmlLanguage(translation[0])} dir={languageDirection(translation[0])}>{translation[1]}</small>}
      </span>
    </button>
    {(overflow || expanded || translation) && <button type="button" className="chapter-expand" aria-label={`${bookCompanionCopy[ui].details} · ${chapter.n}`} aria-expanded={expanded} onClick={() => setExpanded(value => !value)}><ChevronDown size={16} /></button>}
  </li>
}
