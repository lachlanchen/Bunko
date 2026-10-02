import { afterEach, expect, it, vi } from 'vitest'
afterEach(() => vi.unstubAllGlobals())

it('loads a figure through fallback once, saves under its canonical key, and reads it offline', async () => {
  vi.resetModules()
  const saved = new Map<string, Response>()
  vi.stubGlobal('caches', { open: async () => ({ match: async (key: string) => saved.get(key)?.clone(), put: async (key: string, value: Response) => { saved.set(key, value) } }) })
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
  const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('blocked')).mockResolvedValueOnce(new Response(image, { headers: { 'Content-Type': 'image/png' } }))
  vi.stubGlobal('fetch', fetcher)
  const { loadBookImage, cacheFigure } = await import('./bookAssets')
  const path = 'books/physics/assets/diagram.png'
  const [first] = await Promise.all([loadBookImage(path), cacheFigure('physics', 'assets/diagram.png')])
  expect(new Uint8Array(await first.arrayBuffer())).toEqual(new Uint8Array(image))
  expect(fetcher).toHaveBeenCalledTimes(2)
  fetcher.mockRejectedValue(new Error('offline'))
  expect((await loadBookImage(path)).ok).toBe(true)
  expect(fetcher).toHaveBeenCalledTimes(2)
  expect([...saved.keys()]).toEqual(['https://raw.githubusercontent.com/lachlanchen/bunko-books/main/' + path])
})
