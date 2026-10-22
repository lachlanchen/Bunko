import type { BookMeta } from '../types'
import type { UILanguage } from '../i18n'
import type { AgentMessage } from './documentAgent'
import { bookRelevance } from '../../server/agent/book-relevance.mjs'

export interface BookReference { id: string; file: string; chapter: number; paragraph: number; language: string; replyLanguage: UILanguage; scope: 'passage' | 'chapter' | 'book' | 'paragraph' | 'sentence'; quote?: string }
export interface BookCitation { passage: string; paragraph: number; quote: string; chapter?: number; file?: string }
export interface GuideEntity { id: string; name: string; detail: string; aliases: string[]; certainty: 'stated' | 'interpretation' | 'background'; citations: BookCitation[] }
export interface GuideConnection { from: string; to: string; label: string; direction?: 'forward' | 'mutual'; certainty: 'stated' | 'interpretation' | 'background'; citations: BookCitation[] }
export interface GuideEvent { title: string; when: string; detail: string; certainty: 'stated' | 'interpretation' | 'background'; citations: BookCitation[] }
export interface BookResponse {
  visibility?: 'private'; parentId?: string | null; created?: number
  knowledge?: 'passages' | 'background' | 'mixed'; title?: string; answer: string; citations: BookCitation[]; insufficient: boolean; key: string; revision: string; reference: BookReference; reused?: boolean
  coverage: { chapter: number; first: number; last: number; total: number; partial: boolean; scope: BookReference['scope']; language: string; chapters?: number[] }
  people?: GuideEntity[]; relationships?: GuideConnection[]; places?: GuideEntity[]; routes?: GuideConnection[]; events?: GuideEvent[]
}
export interface BookMessage extends AgentMessage { kind: 'answer' | 'guide' | 'explore'; parentId?: string | null; focus?: string; baseGuide?: BookResponse; bookResponse?: BookResponse; reference?: BookReference; referenceTitle?: string }
export interface BookCompanionContext { meta: BookMeta; chapter: number; paragraph: number; language: string; returnTo: 'reader' | 'book' | 'agent'; quote?: string; scope?: BookReference['scope'] }
export function companionReference(context: BookCompanionContext, ui: UILanguage, scope: BookReference['scope']): BookReference {
  return { id: context.meta.id, file: context.meta.chapters[context.chapter].file, chapter: context.chapter, paragraph: context.paragraph,
    language: context.language, replyLanguage: ui, scope, ...(scope === 'sentence' ? { quote: context.quote } : {}) }
}
export const referenceKey = (ref: BookReference) => JSON.stringify(ref)

// Only source-derived public guides are cached here. Questions and chat history stay account-bound.
const cachePrefix = 'bunko-book-guide-v1:'
const artifactPrefix = 'bunko-book-artifact-v2:'
export function savedGuide(ref: BookReference): BookResponse | null {
  try {
    const value = JSON.parse(localStorage.getItem(cachePrefix + referenceKey(ref)) || 'null')
    if (value && value.reference?.file === ref.file && value.people && value.coverage && typeof value.revision === 'string') return value
  } catch { /* Quota or restricted browser storage: online reading still works. */ }
  return null
}
export function saveGuide(ref: BookReference, guide: BookResponse) {
  // Personal followups must never leak into the account-independent public cache.
  if (guide.visibility === 'private' || !Array.isArray(guide.people)) return
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(cachePrefix))
    for (const key of keys.slice(0, Math.max(0, keys.length - 19))) localStorage.removeItem(key)
    localStorage.setItem(cachePrefix + referenceKey(ref), JSON.stringify(guide))
    const artifacts = Object.keys(localStorage).filter(k => k.startsWith(artifactPrefix))
      .map(key => ({ key, at: JSON.parse(localStorage.getItem(key) || '{}').at || 0 })).sort((a, b) => a.at - b.at)
    for (const row of artifacts.slice(0, Math.max(0, artifacts.length - 39))) localStorage.removeItem(row.key)
    localStorage.setItem(artifactPrefix + guide.key, JSON.stringify({ at: Date.now(), guide }))
  } catch { /* Caching is optional. */ }
}
export function forgetGuide(ref: BookReference) {
  try { localStorage.removeItem(cachePrefix + referenceKey(ref)) } catch { /* Optional cache. */ }
}

/** Public generated artifacts survive passage changes; private conversations stay on the account-bound server. */
export function savedGuides(ref: BookReference): BookResponse[] {
  try {
    const values = Object.keys(localStorage).filter(k => k.startsWith(artifactPrefix))
      .map(k => JSON.parse(localStorage.getItem(k) || '{}')).sort((a, b) => b.at - a.at).map(v => v.guide as BookResponse)
    const exact = savedGuide(ref)
    return [...(exact ? [exact] : []), ...values].filter((g, i, all) => g?.reference?.id === ref.id && g.reference.replyLanguage === ref.replyLanguage && g.people && all.findIndex(v => v?.key === g.key) === i)
  } catch { return [] }
}

export type CompanionView = 'chat' | 'people' | 'places' | 'timeline'
export interface ReadingResult { guide: BookResponse; message?: BookMessage; question: string; messageIds?: string[] }
export function hasReadingView(guide: BookResponse, view: CompanionView) {
  return view === 'chat' || (view === 'timeline' ? guide.events : guide[view]) !== undefined
}
export function readingResults(messages: BookMessage[], cached: BookResponse[]): ReadingResult[] {
  const results = new Map<string, ReadingResult>()
  for (const message of messages.filter(m => m.state === 'completed' && m.bookResponse).reverse()) {
    const key = message.bookResponse!.key, old = results.get(key)
    if (old) old.messageIds?.push(message.id)
    else results.set(key, { guide: message.bookResponse!, message, question: message.question, messageIds: [message.id] })
  }
  for (const guide of [...messages.flatMap(m => m.baseGuide ? [m.baseGuide] : []), ...cached]) if (!results.has(guide.key)) results.set(guide.key, { guide, question: '' })
  return [...results.values()]
}
/** Prefer the selected branch, then the nearest saved scope. Merely opening a view never generates. */
export function closestReadingResult(results: ReadingResult[], reference: BookReference, view: CompanionView, selectedKey = ''): ReadingResult | undefined {
  const available = results.filter(row => Number.isFinite(bookRelevance(row.guide.reference, reference)))
  const seen = new Set<string>()
  let selected = available.find(row => row.guide.key === selectedKey)
  while (selected && !seen.has(selected.guide.key)) {
    if (hasReadingView(selected.guide, view)) return selected
    seen.add(selected.guide.key)
    const parent = selected.message?.parentId || selected.guide.parentId
    selected = parent ? available.find(row => row.messageIds?.includes(parent)) : selected.message?.baseGuide ? available.find(row => row.guide.key === selected!.message!.baseGuide!.key) : undefined
  }
  return available.filter(row => hasReadingView(row.guide, view)).sort((a, b) => bookRelevance(a.guide.reference, reference) - bookRelevance(b.guide.reference, reference))[0]
}

/** Keep newer prose on the same branch, but follow a displayed saved diagram
 * from another branch from its own context, never an unrelated conversation. */
export function readingContinuation(results: ReadingResult[], tip?: ReadingResult, displayed?: ReadingResult): ReadingResult | undefined {
  if (!displayed || !tip) return tip || displayed
  const seen = new Set<string>()
  let cursor: ReadingResult | undefined = tip
  while (cursor && !seen.has(cursor.guide.key)) {
    if (cursor.guide.key === displayed.guide.key) return tip
    seen.add(cursor.guide.key)
    const parent: string | null | undefined = cursor.message?.parentId || cursor.guide.parentId
    const base: string | undefined = cursor.message?.baseGuide?.key
    cursor = parent ? results.find(row => row.messageIds?.includes(parent)) : base ? results.find(row => row.guide.key === base) : undefined
  }
  return displayed
}
