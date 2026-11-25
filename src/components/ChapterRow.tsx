import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { BookMeta } from '../types'
import type { UILanguage } from '../i18n'
import { htmlLanguage, languageDirection } from '../lib/languages'
import { chapterDisplayTitle } from '../lib/localizedBook'
import { bookCompanionCopy } from './bookCompanionCopy'

export function ChapterRow({ chapter, primary, ui, active, onRead }: {
  chapter: BookMeta['chapters'][number]; primary: string; ui: UILanguage; active?: boolean; onRead: () => void
}) {
  const [expanded, setExpanded] = useState(false), [overflow, setOverflow] = useState(false)
  const label = useRef<HTMLSpanElement>(null)
  const heading = chapterDisplayTitle(chapter, ui, primary)
  const title = heading.text
  const original = chapter.title[primary]
  const secondary = original && original !== title ? original : null
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
        <bdi lang={htmlLanguage(heading.lang)} dir={languageDirection(heading.lang)}>{title}</bdi>
        {expanded && secondary && <small lang={htmlLanguage(primary)} dir={languageDirection(primary)}>{secondary}</small>}
      </span>
    </button>
    {(overflow || expanded || secondary) && <button type="button" className="chapter-expand" aria-label={`${bookCompanionCopy[ui].details} · ${chapter.n}`} aria-expanded={expanded} onClick={() => setExpanded(value => !value)}><ChevronDown size={16} /></button>}
  </li>
}
