import { afterEach, describe, expect, it, vi } from 'vitest'
import { BOOK_ORIGINS, createBookTransport } from './bookTransport'
afterEach(() => vi.unstubAllEnvs())

describe('public book fallback', () => {
  it('uses GitHub first, avoids mirror bandwidth on success, and never sends credentials', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ books: [] }))
    await createBookTransport({ fetcher })('reader-index.json')
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher.mock.calls[0][0]).toBe(`${BOOK_ORIGINS[0]}/reader-index.json`)
    expect(fetcher.mock.calls[0][1]).toMatchObject({ credentials: 'omit', cache: 'no-cache', redirect: 'error' })
  })
  it('recovers through the owned mirror and retries GitHub after a brief cooldown', async () => {
    let time = 0
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async url => {
      if (String(url).startsWith(BOOK_ORIGINS[0])) return new Response('blocked', { status: 403 })
      if (String(url).startsWith(BOOK_ORIGINS[1])) throw new TypeError('network')
      return Response.json({ ok: true })
    })
    const get = createBookTransport({ fetcher, now: () => time })
    expect(await (await get('reader-index.json')).json()).toEqual({ ok: true })
    expect(fetcher).toHaveBeenCalledTimes(3)
    await get('books/test/meta.json')
    expect(fetcher).toHaveBeenCalledTimes(4)
    time = 60001
    await get('reader-index.json')
    expect(fetcher).toHaveBeenCalledTimes(7)
  })
  it('does not treat a missing file as a host outage, or cache a captive portal', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('', { status: 404 })).mockResolvedValueOnce(Response.json({ ok: true })).mockResolvedValueOnce(new Response('<html>login</html>')).mockResolvedValueOnce(Response.json({ ok: true }))
    const get = createBookTransport({ fetcher })
    await get('books/test/c0001.json')
    await get('reader-index.json')
    expect(fetcher.mock.calls.map(call => String(call[0]).split('/')[2])).toEqual(['raw.githubusercontent.com','cdn.jsdelivr.net','raw.githubusercontent.com','cdn.jsdelivr.net'])
  })
  it('shares a download while cancellation affects only its caller', async () => {
    let complete!: (response: Response) => void
    const fetcher = vi.fn<typeof fetch>().mockImplementation(() => new Promise(resolve => { complete = resolve }))
    const get = createBookTransport({ fetcher }), controller = new AbortController()
    const first = get('reader-index.json', controller.signal), second = get('reader-index.json')
    const cancelled = expect(first).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    complete(Response.json({ shared: true }))
    await cancelled
    expect(await (await second).json()).toEqual({ shared: true })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('times out stalled headers, then advances to the next host', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementationOnce((_url, options) => new Promise((_resolve, reject) => options?.signal?.addEventListener('abort', () => reject(new Error('timeout'))))).mockResolvedValueOnce(Response.json({ ok: true }))
    const get = createBookTransport({ fetcher, timeout: 5 })
    expect(await (await get('reader-index.json')).json()).toEqual({ ok: true })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('rejects paths that could escape the public book repository', async () => {
    const fetcher = vi.fn<typeof fetch>(), get = createBookTransport({ fetcher })
    for (const path of ['../config.json','https://other.test/x','books/x/assets/../../config.png','books/x/c0001.json?token=x','books/x/cover-abc.svg']) await expect(get(path)).rejects.toThrow('Invalid book path')
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('falls back from direct to legacy cache only for credential-free public reads', async () => {
    vi.stubEnv('VITE_BUNKO_DIRECT_ORIGIN', '1'); vi.resetModules()
    const direct = await import('./bookTransport')
    const fetcher = vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('GitHub blocked'))
      .mockRejectedValueOnce(new TypeError('CDN blocked'))
      .mockRejectedValueOnce(new TypeError('direct unavailable'))
      .mockResolvedValueOnce(Response.json({ books: [] }))
    expect(await (await direct.createBookTransport({ fetcher })('reader-index.json')).json()).toEqual({ books: [] })
    expect(fetcher.mock.calls.map(([url]) => String(url))).toEqual([
      `${BOOK_ORIGINS[0]}/reader-index.json`, `${BOOK_ORIGINS[1]}/reader-index.json`,
      'https://bunko.lazying.art/bunko/books-cache/reader-index.json',
      'https://llm.lazying.art/bunko/books-cache/reader-index.json',
    ])
    expect(fetcher.mock.calls.every(([, init]) => init?.credentials === 'omit' && init?.redirect === 'error' && !init?.headers)).toBe(true)
  })
})
