import type { Line, Token } from '../types'

/** The three token shapes the payload uses, unpacked. */
export function tokenParts(token: Token): { text: string; reading: string; role: string } {
  if (typeof token === 'string') return { text: token, reading: '', role: '' }
  return { text: token[0] ?? '', reading: token[1] ?? '', role: token[2] ?? '' }
}

/** A line as plain text, for titles, search and anything that is not the page itself. */
export function plainText(line: Line | undefined): string {
  return (line ?? []).map((token) => tokenParts(token).text).join('')
}

export const ROLE_NAMES: Record<string, string> = {
  s: 'subject',
  p: 'predicate',
  o: 'object',
  a: 'attributive',
  d: 'adverbial',
  c: 'complement',
  t: 'topic',
  f: 'function',
}
