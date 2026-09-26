import { useEffect, useState, type RefObject } from 'react'
import { BookOpen, MessageCircle, TextSelect, X } from 'lucide-react'
import type { UILanguage } from '../i18n'
import { readSelection, selectSentence, type ReaderSelection } from '../lib/readerSelection'

const labels = {
  en: { hint: 'Hold a word to select it. Drag the handles for a phrase.', dictionary: 'Dictionary', sentence: 'Sentence', passage: 'Discuss', close: 'Clear selection', selected: 'Selected text' },
  'zh-Hans': { hint: '长按选词，拖动选区两端可选短语或句子。', dictionary: '查词', sentence: '选整句', passage: '讨论', close: '取消选择', selected: '已选文字' },
  'zh-Hant': { hint: '長按選詞，拖動選區兩端可選短語或句子。', dictionary: '查詞', sentence: '選整句', passage: '討論', close: '取消選取', selected: '已選文字' },
  ja: { hint: '長押しで単語を選択。ハンドルを動かすと語句を選べます。', dictionary: '辞書', sentence: '文を選択', passage: '話し合う', close: '選択を解除', selected: '選択したテキスト' },
}

export function SelectionTools({ host, ui, onOpen }: {
  host: RefObject<HTMLDivElement | null>; ui: UILanguage;
  onOpen: (selection: ReaderSelection, dictionary: boolean) => void;
}) {
  const [selected, setSelected] = useState<ReaderSelection | null>(null)
  useEffect(() => {
    const change = () => setSelected(host.current ? readSelection(host.current) : null)
    document.addEventListener('selectionchange', change)
    return () => { document.removeEventListener('selectionchange', change); window.getSelection()?.removeAllRanges() }
  }, [host])
  const copy = labels[ui]
  if (!selected) return <p className="selection-hint">{copy.hint}</p>
  const clear = () => { window.getSelection()?.removeAllRanges(); setSelected(null) }
  const open = (dictionary: boolean) => { onOpen(selected, dictionary); clear() }
  return <div className="selection-tools" role="region" aria-label={copy.selected} onPointerDown={(event) => event.preventDefault()}>
    <div className="selection-preview"><strong>{selected.text}</strong><button type="button" onClick={clear} aria-label={copy.close}><X size={18} /></button></div>
    <div className="selection-actions">
      <button type="button" className="selection-lookup" onClick={() => open(true)}><BookOpen size={16} /> {copy.dictionary}</button>
      <button type="button" disabled={!selected.passage.contains(selected.range.endContainer)} onClick={() => selectSentence(selected)}><TextSelect size={16} /> {copy.sentence}</button>
      <button type="button" onClick={() => open(false)}><MessageCircle size={16} /> {copy.passage}</button>
    </div>
  </div>
}
