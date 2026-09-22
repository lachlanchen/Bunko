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
}: {
  line: LineTokens | undefined
  ruby?: boolean
  grammar?: boolean
  lang?: string
}) {
  if (!line?.length) return null
  return (
    <span className="line" lang={lang}>
      {line.map((token, index) => {
        const { text, reading, role } = tokenParts(token)
        if (!text) return null
        const className = grammar && role ? `tk role-${role}` : 'tk'
        const title = grammar && role ? ROLE_NAMES[role] : undefined
        if (ruby && reading) {
          return (
            <ruby key={index} className={className} title={title}>
              {text}
              <rt>{reading}</rt>
            </ruby>
          )
        }
        return (
          <span key={index} className={className} title={title}>
            {text}
          </span>
        )
      })}
    </span>
  )
}
