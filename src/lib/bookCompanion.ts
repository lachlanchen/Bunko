import type { BookMeta } from '../types'
import type { UILanguage } from '../i18n'
import type { AgentMessage } from './documentAgent'

export interface BookReference { id: string; file: string; chapter: number; paragraph: number; language: string; replyLanguage: UILanguage; scope: 'passage' | 'chapter' | 'book' | 'paragraph' | 'sentence'; quote?: string }
export interface BookCitation { passage: string; paragraph: number; quote: string; chapter?: number; file?: string }
export interface GuideEntity { id: string; name: string; detail: string; aliases: string[]; certainty: 'stated' | 'interpretation' | 'background'; citations: BookCitation[] }
export interface GuideConnection { from: string; to: string; label: string; direction?: 'forward' | 'mutual'; certainty: 'stated' | 'interpretation' | 'background'; citations: BookCitation[] }
export interface GuideEvent { title: string; when: string; detail: string; certainty: 'stated' | 'interpretation' | 'background'; citations: BookCitation[] }
export interface BookResponse {
  knowledge?: 'passages' | 'background' | 'mixed'; title?: string; answer: string; citations: BookCitation[]; insufficient: boolean; key: string; revision: string; reference: BookReference; reused?: boolean
  coverage: { chapter: number; first: number; last: number; total: number; partial: boolean; scope: BookReference['scope']; language: string; chapters?: number[] }
  people?: GuideEntity[]; relationships?: GuideConnection[]; places?: GuideEntity[]; routes?: GuideConnection[]; events?: GuideEvent[]
}
export interface BookMessage extends AgentMessage { kind: 'answer' | 'guide'; bookResponse?: BookResponse; reference?: BookReference; referenceTitle?: string }
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
