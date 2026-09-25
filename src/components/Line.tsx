/**
 * One line of text, with a reading above every character that has one.
 *
 * This is the heart of the app, so it stays small. Real <ruby> markup is used
 * rather than a stack of absolutely positioned spans: the browser then handles
 * line breaking, selection, search and screen readers correctly, and furigana
 * and pinyin both sit where a reader of that language expects them.
 */
import type { Line as LineTokens } from '../types'
import { ROLE_NAMES, tokenParts } from '../lib/text'

export function Line({
  line,
  ruby = true,
  grammar = false,
  lang,
  onToken,
}: {
  line: LineTokens | undefined
  ruby?: boolean
  grammar?: boolean
  lang?: string
  onToken?: (text: string, reading: string) => void
}) {
  if (!line?.length) return null
  return (
    <span className="line" lang={lang}>
      {line.map((token, index) => {
        const { text, reading, role } = tokenParts(token)
        if (!text) return null
        const lookup = Boolean(onToken && /[\p{L}\p{N}]/u.test(text))
        const className = `${grammar && role ? `tk role-${role}` : 'tk'}${lookup ? ' tk-lookup' : ''}`
        const title = grammar && role ? ROLE_NAMES[role] : undefined
        const action = lookup ? { onClick: () => onToken?.(text.trim(), reading), role: 'button', tabIndex: 0, onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToken?.(text.trim(), reading) } } } : {}
        if (ruby && reading) {
          return (
            <ruby key={index} className={className} title={title} {...action}>
              {text}
              <rt>{reading}</rt>
            </ruby>
          )
        }
        return (
          <span key={index} className={className} title={title} {...action}>
            {text}
          </span>
        )
      })}
    </span>
  )
}
