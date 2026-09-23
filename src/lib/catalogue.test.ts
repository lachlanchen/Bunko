import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const book = { id: 'shiji', mode: 'wenyan_ja_zh', langs: ['wenyan', 'zh', 'ja'], primary: 'wenyan', title: { wenyan: '史記' }, author: '司馬遷', chapters: 1, paras: 1, bytes: 100, sha256: 'v1' }
const index = (rows = [book]) => ({ schema: 1, books: rows, count: rows.length, bytes: 100 })
const response = (data: unknown) => ({ ok: true, json: async () => data })

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllGlobals())

describe('catalog updates without app builds', () => {
  it('notifies an open library when its cached index refreshes', async () => {
    const fresh = index([book, { ...book, id: 'nihon-shoki' }])
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response(index())).mockResolvedValueOnce(response(fresh)))
    const { loadIndex, subscribeIndex } = await import('./library')
    await loadIndex()
    const listener = vi.fn()
    const unsubscribe = subscribeIndex(listener)
    expect((await loadIndex()).count).toBe(1)
    await vi.waitFor(() => expect(listener).toHaveBeenCalledWith(fresh))
    unsubscribe()
  })

  it('keeps the offline catalog when both origins fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response(index())).mockRejectedValue(new Error('offline')))
    const { loadIndex } = await import('./library')
    await loadIndex()
    expect((await loadIndex({ refresh: true })).books[0].id).toBe('shiji')
  })

  it('fetches new book metadata when its catalog revision changes', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(index()))
      .mockResolvedValueOnce(response({ id: 'shiji', chapters: [{ file: 'old.json' }] }))
      .mockResolvedValueOnce(response(index([{ ...book, sha256: 'v2' }])))
      .mockResolvedValueOnce(response({ id: 'shiji', chapters: [{ file: 'new.json' }] }))
    vi.stubGlobal('fetch', fetchMock)
    const { loadIndex, loadMeta } = await import('./library')
    await loadIndex()
    expect((await loadMeta('shiji')).chapters[0].file).toBe('old.json')
    await loadIndex({ refresh: true })
    expect((await loadMeta('shiji')).chapters[0].file).toBe('new.json')
  })

  it('rejects remote or executable cover paths', async () => {
    const { coverUrls } = await import('./library')
    const row = { ...book, langs: ['wenyan'] as const, primary: 'wenyan' as const }
    const data = { ...row, langs: [...row.langs] }
    expect(coverUrls({ ...data, cover: 'https://attacker.test/image.png' })).toEqual([])
    expect(coverUrls({ ...data, cover: 'books/shiji/cover-abcd.svg' })).toEqual([])
    expect(coverUrls({ ...data, cover: 'books/shiji/cover-abcd.webp' })).toHaveLength(2)
  })

  it('opens the previous downloaded edition offline after a catalog update', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response(index()))
      .mockResolvedValueOnce(response({ id: 'shiji', chapters: [{ file: 'old.json' }] }))
      .mockResolvedValueOnce(response(index([{ ...book, sha256: 'v2' }])))
      .mockRejectedValue(new Error('offline')))
    const { loadIndex, loadMeta } = await import('./library')
    await loadIndex()
    await loadMeta('shiji')
    await loadIndex({ refresh: true })
    expect((await loadMeta('shiji')).chapters[0].file).toBe('old.json')
  })
})
