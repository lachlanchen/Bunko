import { htmlLanguage, languageDirection } from '../lib/languages'
import type { LangCode, Paragraph } from '../types'
import { useBookImage } from '../lib/useBookImage'
import { validBookPath } from '../lib/bookTransport'

export function BookFigure({ bookId, figure, lang, primary }: {
  bookId: string; figure: NonNullable<Paragraph['figure']>; lang: LangCode; primary: LangCode
}) {
  const path = `books/${bookId}/${figure.path}`
  const valid = figure.path.startsWith('assets/') && validBookPath(path)
  const { element, src } = useBookImage(valid ? path : '')
  if (!valid) return null
  const caption = figure.caption?.[lang] ?? figure.caption?.[primary] ?? ''
  return <figure className="book-figure"><div ref={element}>{src && <img src={src} alt={caption} />}</div><figcaption lang={htmlLanguage(figure.caption?.[lang] ? lang : primary)} dir={languageDirection(figure.caption?.[lang] ? lang : primary)}>{caption}</figcaption></figure>
}
