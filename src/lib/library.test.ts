import { describe, expect, it } from 'vitest'
import { issueUrl, translationIssueUrl } from './library'

describe('book requests', () => {
  it('opens a prefilled GitHub issue rather than posting to a server of ours', () => {
    const url = issueUrl('The Tale of Genji')
    expect(url.startsWith('https://github.com/lachlanchen/bunko-books/issues/new')).toBe(true)
    expect(decodeURIComponent(url)).toContain('Book request: The Tale of Genji')
  })
})


describe('translation requests', () => {
  it('keeps multilingual titles and reserved characters inside a prefilled public issue', () => {
    const url = new URL(translationIssueUrl({ title: '文庫 & A? #1', bookId: 'book & one', author: 'Author', languages: ['en', 'zh'], target: 'العربية (ar)' }))
    expect(url.origin + url.pathname).toBe('https://github.com/lachlanchen/bunko-books/issues/new')
    expect(url.searchParams.get('title')).toBe('Translation request: 文庫 & A? #1 → العربية (ar)')
    expect(url.searchParams.get('body')).toContain('Available languages: en, zh')
    expect(url.searchParams.get('body')).toContain('Requested language: العربية (ar)')
    expect(url.searchParams.get('body')).toContain('?book=book%20%26%20one')
    expect(url.searchParams.get('body')).not.toContain('undefined')
  })
})
