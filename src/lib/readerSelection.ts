const excluded = 'rt, rp, button, .language-label, .math-inline, .math-display'

function elementAt(node: Node): Element | null {
  return node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement
}

/** Ruby pronunciations and adjacent controls never become dictionary queries. */
export function rangeText(range: Range): string {
  if (elementAt(range.commonAncestorContainer)?.closest(excluded)) return ''
  const fragment = range.cloneContents()
  fragment.querySelectorAll(excluded).forEach((node) => node.remove())
  return fragment.textContent ?? ''
}

export interface ReaderSelection { text: string; passage: HTMLElement; range: Range }

export function readSelection(host: HTMLElement, selection = window.getSelection()): ReaderSelection | null {
  if (!selection || selection.isCollapsed || !selection.rangeCount) return null
  const range = selection.getRangeAt(0)
  const passage = elementAt(range.startContainer)?.closest<HTMLElement>('[data-reading]')
  const endPassage = elementAt(range.endContainer)?.closest<HTMLElement>('[data-reading]')
  if (!passage || !endPassage || !host.contains(passage) || !host.contains(endPassage)) return null
  // Keep language layers separate, including when native selection handles cross a badge.
  const passages = [...host.querySelectorAll<HTMLElement>('[data-reading]')].filter((node) => range.intersectsNode(node))
  if (passages.some((node) => node.dataset.lang !== passage.dataset.lang)) return null
  const text = rangeText(range).trim()
  return /[\p{L}\p{N}]/u.test(text) ? { text, passage, range: range.cloneRange() } : null
}

/** Expand only to the sentence containing the selection, not the payload token. */
export function selectSentence(selected: ReaderSelection): void {
  const { passage, range } = selected
  if (!passage.contains(range.endContainer)) return
  const prefix = document.createRange()
  prefix.selectNodeContents(passage)
  prefix.setEnd(range.startContainer, range.startOffset)
  const offset = rangeText(prefix).length
  const whole = document.createRange()
  whole.selectNodeContents(passage)
  const text = rangeText(whole)
  const segments = typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter(passage.lang || 'en', { granularity: 'sentence' }).segment(text)].map(({ index, segment }) => ({ index, segment }))
    : [...text.matchAll(/[^。！？.!?]+[。！？.!?]*\s*/gu)].map((match) => ({ index: match.index, segment: match[0] }))
  const sentence = segments.find(({ index, segment }) => offset < index + segment.length)
  if (!sentence) return
  const walker = document.createTreeWalker(passage, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => elementAt(node)?.closest(excluded) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  })
  const result = document.createRange()
  let count = 0, started = false
  while (walker.nextNode()) {
    const node = walker.currentNode
    const length = node.textContent?.length ?? 0
    if (!started && sentence.index < count + length) {
      result.setStart(node, Math.max(0, sentence.index - count))
      started = true
    }
    const end = sentence.index + sentence.segment.trimEnd().length
    if (started && end <= count + length) {
      result.setEnd(node, end - count)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(result)
      document.dispatchEvent(new Event('selectionchange'))
      return
    }
    count += length
  }
}
