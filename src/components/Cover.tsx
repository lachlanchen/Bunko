import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import type { BookRow } from '../types'
import { coverUrls } from '../lib/library'

/** Artwork contains no typography; the accessible title lives below the cover. */
export function Cover({ book }: { book: BookRow }) {
  const urls = coverUrls(book)
  const [failed, setFailed] = useState<string[]>([])
  const url = urls.find((candidate) => !failed.includes(candidate))
  const hue = [...book.id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 360
  return (
    <div className={`cover${url ? ' cover-art' : ''}`} style={{ '--hue': hue } as React.CSSProperties} aria-hidden="true">
      {url ? <img src={url} alt="" loading="lazy" decoding="async" onError={() => setFailed((current) => [...current, url])} /> : <BookOpen size={38} strokeWidth={0.8} />}
    </div>
  )
}
