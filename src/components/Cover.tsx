import { BookOpen } from 'lucide-react'
import type { BookRow } from '../types'
import { useBookImage } from '../lib/useBookImage'
import { validBookPath } from '../lib/bookTransport'

/** Artwork contains no typography; the accessible title lives below the cover. */
export function Cover({ book }: { book: BookRow }) {
  const { element, src } = useBookImage(book.cover && /^books\/[a-z0-9-]+\/cover-/.test(book.cover) && validBookPath(book.cover) ? book.cover : '')
  const hue = [...book.id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 360
  return (
    <div ref={element} className={`cover${src ? ' cover-art' : ''}`} style={{ '--hue': hue } as React.CSSProperties} aria-hidden="true">
      {src ? <img src={src} alt="" decoding="async" /> : <BookOpen size={38} strokeWidth={0.8} />}
    </div>
  )
}
