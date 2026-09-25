/** The shape of everything the app downloads from the bunko-books repository. */

/** A token is a bare string, `[text, reading]`, or `[text, reading, role]`. */
export type Token = string | [string] | [string, string] | [string, string, string]

export type Line = Token[]

export type LangCode = 'en' | 'zh' | 'ja' | 'wenyan' | 'zh_modern' | 'ja_modern'

export interface BookRow {
  id: string
  mode: string
  langs: LangCode[]
  primary: LangCode
  title: Partial<Record<LangCode, string>>
  author: string
  chapters: number
  paras: number
  bytes: number
  sha256: string
  cat?: 'chinese' | 'japanese' | 'world' | 'physics' | 'learning' | 'finance' | 'travel'
  cover?: string
  edition?: 'multilingual' | 'original-only'
}

export interface ReaderIndex {
  schema: number
  books: BookRow[]
  bytes: number
  count: number
}

export interface ChapterRow {
  n: number
  file: string
  bytes: number
  paras: number
  title: Partial<Record<LangCode, string>>
  sha256?: string
}

export interface BookMeta {
  schema: number
  id: string
  mode: string
  langs: LangCode[]
  primary: LangCode
  title: Partial<Record<LangCode, Line>>
  titleText: Partial<Record<LangCode, string>>
  author: { name?: string; reading_zh?: string; reading_ja?: string; reading_en?: string }
  chapters: ChapterRow[]
  bytes: number
  paras: number
}

export interface Unit extends Partial<Record<LangCode, Line>> {
  src: string
  rich?: Partial<Record<LangCode, Array<{ text?: string; math?: string; display?: boolean }>>>
}

export interface Paragraph {
  id: string
  src: string
  u: Unit[]
  kind?: 'text' | 'heading' | 'equation' | 'figure'
  figure?: { path: string; caption?: Partial<Record<LangCode, string>> }
}

export interface Chapter {
  id: string
  n: number
  title: Partial<Record<LangCode, Line>>
  p: Paragraph[]
}

/** How the lines of one unit are stacked on the page. */
export type Layout = 'source' | 'interlinear' | 'paired'

export interface ReadingSettings {
  /** Languages the reader wants to see, in display order. */
  langs: LangCode[]
  layout: Layout
  ruby: boolean
  grammar: boolean
  fontScale: number
  theme: 'paper' | 'night' | 'system'
  serif: boolean
}

export interface Place {
  chapter: number
  paragraph: number
}
