// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Line } from './Line'
import { plainText } from '../lib/text'
import type { Line as LineTokens } from '../types'

// The three token shapes the payload uses, in one line.
const line: LineTokens = [['道', 'dào', 's'], ['可', 'kě'], '，', ['道', 'dào', 'a']]

describe('the ruby renderer', () => {
  it('puts a reading above every token that has one, and leaves the others bare', () => {
    const { container } = render(<Line line={line} />)
    const rubies = container.querySelectorAll('ruby')
    expect(rubies).toHaveLength(3)
    expect([...container.querySelectorAll('rt')].map((node) => node.textContent)).toEqual(['dào', 'kě', 'dào'])
    expect(container.textContent).toBe('道dào可kě，道dào')
  })

  it('drops the readings when the reader turns them off', () => {
    const { container } = render(<Line line={line} ruby={false} />)
    expect(container.querySelectorAll('ruby')).toHaveLength(0)
    expect(container.textContent).toBe('道可，道')
  })

  it('colours by grammatical role only when asked', () => {
    const plain = render(<Line line={line} />).container
    expect(plain.querySelectorAll('.role-s')).toHaveLength(0)
    const coloured = render(<Line line={line} grammar />).container
    expect(coloured.querySelectorAll('.role-s')).toHaveLength(1)
    expect(coloured.querySelectorAll('.role-a')).toHaveLength(1)
  })

  it('reads the plain text back out for titles and search', () => {
    expect(plainText(line)).toBe('道可，道')
    expect(plainText(undefined)).toBe('')
  })
})
