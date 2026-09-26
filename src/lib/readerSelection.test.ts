// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { readSelection, selectSentence } from './readerSelection'

afterEach(() => { window.getSelection()?.removeAllRanges(); document.body.replaceChildren() })
function select(start: Node, from: number, end = start, to = from + 1) {
  const range = document.createRange()
  range.setStart(start, from); range.setEnd(end, to)
  window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(range)
  return readSelection(document.body)
}

it('looks up only the chosen word inside a sentence-sized token', () => {
  document.body.innerHTML = '<span data-reading data-lang="en" lang="en">A quiet evening. Another sentence.</span>'
  const text = document.body.firstChild!.firstChild!
  const selected = select(text, 2, text, 7)!
  expect(selected.text).toBe('quiet')
  selectSentence(selected)
  expect(readSelection(document.body)?.text).toBe('A quiet evening.')
})

it('expands Chinese sentences across ruby nodes without pinyin contamination', () => {
  document.body.innerHTML = '<span data-reading data-lang="zh" lang="zh-Hans"><ruby>春<rt>chūn</rt></ruby><ruby>风<rt>fēng</rt></ruby>来了。花开了。</span>'
  const text = document.querySelectorAll('ruby')[1].firstChild!
  const selected = select(text, 0)!
  expect(selected.text).toBe('风')
  selectSentence(selected)
  expect(readSelection(document.body)?.text).toBe('春风来了。')
})

it('keeps Japanese word selection and sentence expansion distinct', () => {
  document.body.innerHTML = '<span data-reading data-lang="ja" lang="ja">猫が眠る。鳥が歌う。</span>'
  const text = document.body.firstChild!.firstChild!
  const selected = select(text, 5)!
  expect(selected.text).toBe('鳥')
  selectSentence(selected)
  expect(readSelection(document.body)?.text).toBe('鳥が歌う。')
})

it('does not merge translation layers or look up ruby readings alone', () => {
  document.body.innerHTML = '<span data-reading data-lang="zh"><ruby>春<rt>chūn</rt></ruby></span><span data-reading data-lang="en">spring</span>'
  const chinese = document.querySelector('ruby')!.firstChild!
  const english = document.body.lastChild!.firstChild!
  expect(select(chinese, 0, english, 6)).toBeNull()
  expect(select(document.querySelector('rt')!.firstChild!, 0)).toBeNull()
})

it('preserves a phrase spanning adjacent units of the same language', () => {
  document.body.innerHTML = '<p><span data-reading data-lang="en">A quiet </span><button>Discuss</button><span data-reading data-lang="en">evening.</span></p>'
  const spans = document.querySelectorAll('[data-reading]')
  expect(select(spans[0].firstChild!, 2, spans[1].firstChild!, 7)?.text).toBe('quiet evening')
})

it('rejects selections extending into captions or chapter controls', () => {
  document.body.innerHTML = '<span data-reading data-lang="en">A quiet evening.</span><figcaption>Picture credit</figcaption>'
  expect(select(document.body.firstChild!.firstChild!, 2, document.body.lastChild!.firstChild!, 7)).toBeNull()
})
