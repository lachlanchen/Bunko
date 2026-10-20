import { ArrowUpRight, BookOpen } from 'lucide-react'
import type { UILanguage } from '../i18n'
import type { BookCitation } from '../lib/bookCompanion'
import { bookCompanionCopy } from './bookCompanionCopy'

export function PassageEvidence({ citations, ui, onRead }: { citations: BookCitation[]; ui: UILanguage; onRead: (paragraph: number, citation?: BookCitation) => void }) {
  const t = bookCompanionCopy[ui]
  if (!citations.length) return null
  return <details className="guide-evidence"><summary><BookOpen size={14} />{t.evidence} · {citations.map(c => c.passage).join(', ')}</summary>
    {citations.map((c, i) => <blockquote key={`${c.passage}:${i}`}><p dir="auto">{c.quote}</p><button type="button" onClick={() => onRead(c.paragraph, c)}>{t.source} · {c.passage}<ArrowUpRight size={14} /></button></blockquote>)}
  </details>
}
