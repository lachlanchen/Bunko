import { describe, expect, it } from 'vitest'
import { issueUrl } from './library'

describe('book requests', () => {
  it('opens a prefilled GitHub issue rather than posting to a server of ours', () => {
    const url = issueUrl('The Tale of Genji')
    expect(url.startsWith('https://github.com/lachlanchen/bunko-books/issues/new')).toBe(true)
    expect(decodeURIComponent(url)).toContain('Book request: The Tale of Genji')
  })
})
