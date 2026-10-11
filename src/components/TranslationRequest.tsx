import { useId, useState } from 'react'
import { languageName, type UILanguage } from '../i18n'
import type { BookMeta } from '../types'
import { translationIssueUrl } from '../lib/library'
import { availableTranslation, translationLanguages } from '../lib/availableTranslation'

const words = {
  en: { title: 'Request a translation', hint: 'Choose a language, then review and submit the public request on GitHub. Requests are reviewed before a new edition is prepared.', book: 'Book title', language: 'Target language', other: 'Another language', placeholder: 'Language or language tag', send: 'Open translation request', existing: 'View existing requests', available: 'Available languages', ready: 'This language is already available. Continue reading without a new request.', read: 'Read in', availableOption: 'Available' },
  'zh-Hans': { title: '申请翻译', hint: '选择语言后，在 GitHub 查看并提交公开申请。审核后再安排制作新语言版本。', book: '书名', language: '目标语言', other: '其他语言', placeholder: '语言名称或语言代码', send: '打开翻译申请', existing: '查看已有申请', available: '已有语言', ready: '已有此语言版本，无需重复申请，可直接阅读。', read: '阅读：', availableOption: '已有' },
  'zh-Hant': { title: '申請翻譯', hint: '選擇語言後，在 GitHub 查看並提交公開申請。審核後再安排製作新語言版本。', book: '書名', language: '目標語言', other: '其他語言', placeholder: '語言名稱或語言代碼', send: '開啟翻譯申請', existing: '查看已有申請', available: '已有語言', ready: '已有此語言版本，無需重複申請，可直接閱讀。', read: '閱讀：', availableOption: '已有' },
  ja: { title: '翻訳をリクエスト', hint: '言語を選び、GitHub で公開リクエストを確認して送信します。内容を確認してから新しい言語版を準備します。', book: '書名', language: '翻訳先の言語', other: 'その他の言語', placeholder: '言語名または言語コード', send: '翻訳リクエストを開く', existing: '既存のリクエストを見る', available: '利用できる言語', ready: 'この言語は利用できます。新しい依頼をせず、そのまま読めます。', read: '読む：', availableOption: '利用可能' },
}

export function TranslationRequest({ ui, book, expanded = false, onRead }: { ui: UILanguage; book?: BookMeta | null; expanded?: boolean; onRead?: (language: string) => void }) {
  const copy = words[ui], id = useId()
  const [title, setTitle] = useState(''), [language, setLanguage] = useState<string>(ui), [other, setOther] = useState('')
  const bookTitle = book ? book.titleText[book.primary] || book.id : title.trim()
  const target = language === 'other' ? other.trim() : `${languageName(language, 'en')} (${language})`
  const available = book ? availableTranslation(book.langs, language === 'other' ? other : language) : undefined
  const href = !available && bookTitle && target ? translationIssueUrl({ title: bookTitle, bookId: book?.id, author: book?.author.name, languages: book?.langs, target }) : undefined
  const query = `is:issue "Translation request:" ${book ? `"${book.id}"` : ''}`
  return <details className="translation-request" open={expanded || undefined}>
    <summary>{copy.title}</summary>
    <p className={available ? "translation-ready" : "hint"} role="status">{available ? copy.ready : copy.hint}</p>
    {book ? <p><strong dir="auto">{bookTitle}</strong><small>{copy.available}: {book.langs.map(lang => languageName(lang, ui)).join(' · ')}</small></p> : <label htmlFor={`${id}-book`}>{copy.book}<input id={`${id}-book`} maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></label>}
    <label htmlFor={`${id}-language`}>{copy.language}<select aria-label={copy.language} id={`${id}-language`} value={language} onChange={e => setLanguage(e.target.value)}>{translationLanguages.map(lang => <option key={lang} value={lang}>{languageName(lang, ui)}{book && availableTranslation(book.langs, lang) ? ` · ${copy.availableOption}` : ''}</option>)}<option value="other">{copy.other}</option></select></label>
    {language === 'other' && <label htmlFor={`${id}-other`}>{copy.other}<input id={`${id}-other`} maxLength={80} placeholder={copy.placeholder} value={other} onChange={e => setOther(e.target.value)} /></label>}
    <div className="translation-links">{available ? <button type="button" className="primary" disabled={!onRead} onClick={() => onRead?.(available)}>{copy.read} {languageName(available, ui)}</button> : <a className="button" href={href} aria-disabled={!href} target="_blank" rel="noopener noreferrer">{copy.send} ↗</a>}<a href={`https://github.com/lachlanchen/bunko-books/issues?q=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer">{copy.existing}</a></div>
  </details>
}
