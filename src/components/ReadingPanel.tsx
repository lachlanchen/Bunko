import { useEffect, useState } from 'react'
import { ArrowUpRight, BookOpen, MessageCircle, NotebookPen, X } from 'lucide-react'
import type { LangCode, Unit } from '../types'
import type { UILanguage } from '../i18n'
import { languageName } from '../i18n'
import { dictionaryLanguage, discussionNewUrl, discussionTitle, lookupWord, passageText, type Definition } from '../lib/readingTools'
import { downloadDictionary, installedDictionary, removeDictionary, type DictionaryLanguage } from '../lib/offlineDictionary'

interface Focus {
  key: string
  unit: Unit
  lang: LangCode
  word?: string
  reading?: string
}

const labels = {
  en: { dictionary: 'Dictionary', discussion: 'Discussion', note: 'My note', contextual: 'In this passage', lookup: 'Look up', source: 'Wiktionary', unavailable: 'No entry found. Try a longer word or phrase.', offline: 'Dictionary needs a connection for the first lookup.', discussHint: 'A public conversation for this passage. GitHub sign-in is required to post.', start: 'Start the conversation', reply: 'Read and reply on GitHub', noDiscussion: 'No public conversation yet.', noteHint: 'Private to this device', save: 'Save note', saved: 'Saved', close: 'Close' },
  'zh-Hans': { dictionary: '词典', discussion: '讨论', note: '我的笔记', contextual: '本段对照', lookup: '查词', source: '维基词典', unavailable: '未找到词条。可尝试输入更长的词语。', offline: '首次查词需要联网。', discussHint: '这一段的公开讨论。发表需要登录 GitHub。', start: '发起讨论', reply: '在 GitHub 阅读与回复', noDiscussion: '暂无公开讨论。', noteHint: '仅保存在本机', save: '保存笔记', saved: '已保存', close: '关闭' },
  'zh-Hant': { dictionary: '詞典', discussion: '討論', note: '我的筆記', contextual: '本段對照', lookup: '查詞', source: '維基詞典', unavailable: '找不到詞條。可嘗試輸入較長的詞語。', offline: '首次查詞需要連線。', discussHint: '這一段的公開討論。發表需要登入 GitHub。', start: '發起討論', reply: '在 GitHub 閱讀與回覆', noDiscussion: '暫無公開討論。', noteHint: '只儲存在本機', save: '儲存筆記', saved: '已儲存', close: '關閉' },
  ja: { dictionary: '辞書', discussion: 'ディスカッション', note: '自分のメモ', contextual: 'この箇所の対訳', lookup: '調べる', source: 'ウィクショナリー', unavailable: '見出し語が見つかりません。語句を変えてみてください。', offline: '初回の辞書検索には接続が必要です。', discussHint: 'この箇所についての公開討論です。投稿には GitHub ログインが必要です。', start: '話し合いを始める', reply: 'GitHub で読む・返信する', noDiscussion: '公開討論はまだありません。', noteHint: 'この端末だけに保存', save: 'メモを保存', saved: '保存しました', close: '閉じる' },
}

const packLabels = {
  en: { download: 'Download offline dictionary', ready: 'Available offline', remove: 'Remove download', failed: 'Download failed. Try again.', source: 'Dictionary source' },
  'zh-Hans': { download: '下载离线词典', ready: '可离线使用', remove: '删除下载', failed: '下载失败，请重试。', source: '词典来源' },
  'zh-Hant': { download: '下載離線詞典', ready: '可離線使用', remove: '刪除下載', failed: '下載失敗，請重試。', source: '詞典來源' },
  ja: { download: 'オフライン辞書をダウンロード', ready: 'オフラインで利用可能', remove: 'ダウンロードを削除', failed: 'ダウンロードできませんでした。再試行してください。', source: '辞書の出典' },
}

const packNames: Record<DictionaryLanguage, string> = { en: 'Open English WordNet', zh: 'CC-CEDICT', ja: 'JMdict' }
const packSizes: Record<DictionaryLanguage, string> = { en: '5.3 MB', zh: '6.9 MB', ja: '16 MB' }

interface Issue { number: number; html_url: string; comments: number; body: string; user?: { login: string } }
interface Comment { id: number; body: string; user?: { login: string } }

export function ReadingPanel({ focus, ui, onClose }: { focus: Focus; ui: UILanguage; onClose: () => void }) {
  const t = labels[ui]
  const p = packLabels[ui]
  const packLang = dictionaryLanguage(focus.lang)
  const [tab, setTab] = useState<'dictionary' | 'discussion' | 'note'>(focus.word ? 'dictionary' : 'discussion')
  const [word, setWord] = useState(focus.word ?? '')
  const [definitions, setDefinitions] = useState<Definition[]>([])
  const [dictState, setDictState] = useState<'idle' | 'loading' | 'empty' | 'error'>(focus.word ? 'loading' : 'idle')
  const [pack, setPack] = useState<Awaited<ReturnType<typeof installedDictionary>>>(null)
  const [packProgress, setPackProgress] = useState<[number, number] | null>(null)
  const [packError, setPackError] = useState(false)
  const [issue, setIssue] = useState<Issue | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [discussionState, setDiscussionState] = useState<'loading' | 'ready' | 'error'>('loading')
  const noteKey = `bunko:note:${focus.key}`
  const [note, setNote] = useState(() => { try { return localStorage.getItem(noteKey) ?? '' } catch { return '' } })
  const [saved, setSaved] = useState(false)

  useEffect(() => { void installedDictionary(packLang).then(setPack).catch(() => {}) }, [packLang])

  const installPack = async () => {
    setPackError(false)
    setPackProgress([0, 16])
    try {
      const next = await downloadDictionary(packLang, (done, total) => setPackProgress([done, total]))
      setPack(next)
      setPackProgress(null)
      if (word.trim()) {
        const found = await lookupWord(word, focus.lang)
        setDefinitions(found)
        setDictState(found.length ? 'idle' : 'empty')
      }
    } catch { setPackError(true); setPackProgress(null) }
  }

  const uninstallPack = async () => {
    await removeDictionary(packLang)
    setPack(null)
    setDefinitions([])
    setDictState('idle')
  }

  useEffect(() => {
    if (tab !== 'dictionary' || !word.trim()) return
    const controller = new AbortController()
    lookupWord(word, focus.lang, controller.signal)
      .then((items) => { setDefinitions(items); setDictState(items.length ? 'idle' : 'empty') })
      .catch(() => { if (!controller.signal.aborted) setDictState('error') })
    return () => controller.abort()
  }, [word, focus.lang, tab])

  useEffect(() => {
    if (tab !== 'discussion') return
    const controller = new AbortController()
    const query = `repo:lachlanchen/bunko-books in:title "${discussionTitle(focus.key)}"`
    fetch(`https://api.github.com/search/issues?${new URLSearchParams({ q: query, per_page: '5' })}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error(String(response.status)); return response.json() })
      .then((data: { items?: Issue[] }) => {
        const match = data.items?.find((item) => item.body?.includes(`Passage: ${focus.key}`)) ?? null
        setIssue(match)
        if (!match) { setDiscussionState('ready'); return }
        return fetch(`https://api.github.com/repos/lachlanchen/bunko-books/issues/${match.number}/comments?per_page=30`, { signal: controller.signal })
          .then((response) => response.ok ? response.json() as Promise<Comment[]> : [])
          .then((items) => { setComments(items); setDiscussionState('ready') })
      })
      .catch(() => { if (!controller.signal.aborted) setDiscussionState('error') })
    return () => controller.abort()
  }, [focus.key, tab])

  const excerpt = passageText(focus.unit, focus.lang)
  const visibleDefinitions = definitions.slice().sort((left, right) => word === focus.word && focus.reading ? Number(right.reading === focus.reading) - Number(left.reading === focus.reading) : 0).slice(0, 8)
  const wiktionaryUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(word.trim())}`
  const available = (['en', 'zh', 'ja', 'wenyan', 'zh_modern', 'ja_modern'] as LangCode[])
    .filter((lang) => passageText(focus.unit, lang))

  return <div className="reading-panel-backdrop" onClick={onClose}>
    <aside className="reading-panel" role="dialog" aria-modal="true" aria-label={t[tab]} onClick={(event) => event.stopPropagation()}>
      <header>
        <div className="reading-panel-kicker"><BookOpen size={15} /> {languageName(focus.lang, ui)} · {focus.reading || t.contextual}</div>
        <button type="button" onClick={onClose} aria-label={t.close}><X size={20} /></button>
      </header>
      <blockquote lang={dictionaryLanguage(focus.lang)}>{excerpt}</blockquote>
      <nav className="reading-panel-tabs" aria-label="Reading tools">
        <button type="button" className={tab === 'dictionary' ? 'active' : ''} onClick={() => setTab('dictionary')}><BookOpen size={15} /> {t.dictionary}</button>
        <button type="button" className={tab === 'discussion' ? 'active' : ''} onClick={() => setTab('discussion')}><MessageCircle size={15} /> {t.discussion}</button>
        <button type="button" className={tab === 'note' ? 'active' : ''} onClick={() => setTab('note')}><NotebookPen size={15} /> {t.note}</button>
      </nav>
      <div className="reading-panel-body">
        {tab === 'dictionary' && <>
          <form className="dictionary-search" onSubmit={(event) => { event.preventDefault(); setDictState('loading'); setDefinitions([]); setWord(new FormData(event.currentTarget).get('word')?.toString().trim() ?? '') }}>
            <input name="word" key={focus.word} defaultValue={word} aria-label={t.lookup} lang={dictionaryLanguage(focus.lang)} />
            <button type="submit">{t.lookup}</button>
          </form>
          {visibleDefinitions.length > 0 && <div className="definition-list">{visibleDefinitions.map((entry, index) => <p key={index}><small>{[entry.reading, entry.partOfSpeech].filter(Boolean).join(' · ')}</small>{entry.meaning}</p>)}</div>}
          {dictState === 'loading' && <p className="panel-hint">…</p>}
          {dictState === 'empty' && <p className="panel-hint">{t.unavailable}</p>}
          {dictState === 'error' && <p className="panel-hint">{t.offline}</p>}
          <div className="offline-pack">
            <div><strong>{packNames[packLang]}</strong><small>{pack ? `${p.ready} · ${(pack.bytes / 1_000_000).toFixed(1)} MB` : `${packSizes[packLang]} · ${p.source}`}</small></div>
            {pack ? <button type="button" onClick={() => void uninstallPack()}>{p.remove}</button> : <button type="button" disabled={Boolean(packProgress)} onClick={() => void installPack()}>{packProgress ? `${packProgress[0]}/${packProgress[1]}` : p.download}</button>}
          </div>
          {packError && <p className="panel-hint">{p.failed}</p>}
          <a className="panel-link" href={pack?.source ?? { en: 'https://en-word.net/downloads', zh: 'https://www.mdbg.net/chinese/dictionary?page=cc-cedict', ja: 'https://www.edrdg.org/wiki/JMdict-EDICT_Dictionary_Project.html' }[packLang]} target="_blank" rel="noopener noreferrer">{p.source}: {packNames[packLang]} · {pack?.license ?? (packLang === 'en' ? 'CC BY 4.0' : 'CC BY-SA 4.0')} <ArrowUpRight size={15} /></a>
          <a className="panel-link" href={wiktionaryUrl} target="_blank" rel="noopener noreferrer">{t.source} <ArrowUpRight size={15} /></a>
          <h3>{t.contextual}</h3>
          <div className="contextual-lines">{available.map((lang) => <p key={lang} lang={dictionaryLanguage(lang)}><strong>{languageName(lang, ui)}</strong><span>{passageText(focus.unit, lang)}</span></p>)}</div>
        </>}
        {tab === 'discussion' && <>
          <p className="panel-hint">{t.discussHint}</p>
          {discussionState === 'loading' && <p className="panel-hint">…</p>}
          {discussionState === 'error' && <p className="panel-hint">{t.offline}</p>}
          {discussionState === 'ready' && !issue && <p className="panel-hint">{t.noDiscussion}</p>}
          {issue && <div className="discussion-comments"><p><strong>{issue.user?.login}</strong><span>{issue.body.split('\n\n').slice(2).join('\n\n')}</span></p>{comments.map((comment) => <p key={comment.id}><strong>{comment.user?.login}</strong><span>{comment.body}</span></p>)}</div>}
          <a className="panel-cta" href={issue?.html_url ?? discussionNewUrl(focus.key, excerpt)} target="_blank" rel="noopener noreferrer">{issue ? t.reply : t.start} <ArrowUpRight size={16} /></a>
        </>}
        {tab === 'note' && <>
          <p className="panel-hint">{t.noteHint}</p>
          <textarea value={note} onChange={(event) => { setNote(event.target.value); setSaved(false) }} rows={7} aria-label={t.note} />
          <button className="panel-cta" type="button" onClick={() => { try { if (note) localStorage.setItem(noteKey, note); else localStorage.removeItem(noteKey); setSaved(true) } catch { setSaved(false) } }}>{saved ? t.saved : t.save}</button>
        </>}
      </div>
    </aside>
  </div>
}

export type { Focus as ReadingFocus }
