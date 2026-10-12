import { describe, expect, it } from 'vitest'
import { bookMirrorOrigins, DIRECT_BUNKO_API, discussionOrigin, LEGACY_BUNKO_API } from './serviceOrigins'

describe('dedicated Bunko origin rollout', () => {
  it('keeps unqualified builds and host-only web cookies on the legacy endpoint', () => {
    expect(discussionOrigin(true, false)).toBe(LEGACY_BUNKO_API)
    expect(discussionOrigin(false, false)).toBe(LEGACY_BUNKO_API)
    expect(discussionOrigin(false, true)).toBe(LEGACY_BUNKO_API)
  })
  it('uses the direct origin for qualified native opaque sessions', () => {
    expect(discussionOrigin(true, true)).toBe(DIRECT_BUNKO_API)
  })
  it('retains the legacy public cache as the last fallback after direct enablement', () => {
    expect(bookMirrorOrigins(false)).toEqual([`${LEGACY_BUNKO_API}/books-cache`])
    expect(bookMirrorOrigins(true)).toEqual([`${DIRECT_BUNKO_API}/books-cache`, `${LEGACY_BUNKO_API}/books-cache`])
  })
})
