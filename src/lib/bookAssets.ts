const ASSET_CACHE = 'bunko-book-assets-v1'

export function assetUrl(bookId: string, path: string): string {
  return `https://raw.githubusercontent.com/lachlanchen/bunko-books/main/books/${bookId}/${path}`
}

export async function cacheFigure(bookId: string, path: string): Promise<void> {
  if (!('caches' in window) || !/^assets\/[a-zA-Z0-9/_-]+\.(?:png|jpe?g|webp)$/.test(path)) return
  const url = assetUrl(bookId, path)
  const cache = await caches.open(ASSET_CACHE)
  if (await cache.match(url)) return
  const response = await fetch(url)
  if (response.ok) await cache.put(url, response)
}

export async function cachedFigure(bookId: string, path: string): Promise<Response | undefined> {
  if (!('caches' in window)) return undefined
  return (await caches.open(ASSET_CACHE)).match(assetUrl(bookId, path))
}

export async function removeFigures(bookId: string): Promise<void> {
  if (!('caches' in window)) return
  const cache = await caches.open(ASSET_CACHE)
  const prefix = assetUrl(bookId, 'assets/')
  for (const request of await cache.keys()) if (request.url.startsWith(prefix)) await cache.delete(request)
}
