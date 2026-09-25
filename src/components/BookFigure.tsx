import { useEffect, useState } from 'react'
import type { LangCode, Paragraph } from '../types'
import { assetUrl, cacheFigure, cachedFigure } from '../lib/bookAssets'

export function BookFigure({ bookId, figure, lang, primary }: {
  bookId: string; figure: NonNullable<Paragraph['figure']>; lang: LangCode; primary: LangCode
}) {
  const valid = /^assets\/[a-zA-Z0-9/_-]+\.(?:png|jpe?g|webp)$/.test(figure.path)
  const remote = valid ? assetUrl(bookId, figure.path) : ''
  const [src, setSrc] = useState(remote)
  useEffect(() => {
    if (!valid) return
    let cancelled = false
    let objectUrl = ''
    void (async () => {
      try {
        await cacheFigure(bookId, figure.path)
        const cached = await cachedFigure(bookId, figure.path)
        if (cached && !cancelled) {
          objectUrl = URL.createObjectURL(await cached.blob())
          setSrc(objectUrl)
        }
      } catch { /* The figure retains its network URL if caching is unavailable. */ }
    })()
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [bookId, figure.path, remote, valid])
  if (!valid) return null
  const caption = figure.caption?.[lang] ?? figure.caption?.[primary] ?? ''
  return <figure className="book-figure"><img loading="lazy" src={src} alt={caption} /><figcaption>{caption}</figcaption></figure>
}
