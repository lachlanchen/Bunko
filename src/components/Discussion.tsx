import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowUpRight, LogIn, Send } from 'lucide-react'
import type { UILanguage } from '../i18n'
import { discussionNewUrl } from '../lib/readingTools'
import { currentUser, DiscussionError, postDiscussion, readDiscussion, requestId, signIn, signOut, subscribeSession, type DiscussionThread } from '../lib/discussions'

const labels = {
  en: { hint: 'A public conversation, shared with readers on GitHub.', empty: 'Be the first to leave a thought.', login: 'Continue with GitHub', signing: 'Complete sign-in, then return here.', cancel: 'Cancel', logout: 'Sign out', placeholder: 'Ask a question or share an annotation…', post: 'Post comment', posting: 'Posting…', posted: 'Your comment is published.', more: 'Load more comments', refresh: 'Refresh', external: 'View on GitHub', public: 'Public on GitHub under your username. Your draft stays on this device until you post.', error: 'Could not connect. Your draft is safe; try again.', auth: 'Please sign in again. Your draft is safe.', limited: 'GitHub is busy. Please wait a little before trying again.', uncertain: 'The connection dropped while posting. Check the conversation on GitHub before sending anything again.', popup: 'Allow the sign-in window, then try again.', cancelled: 'Sign-in was cancelled or expired. Try again when ready.', setup: 'In-app sign-in is being set up. You can join this conversation on GitHub for now.', locked: 'This conversation is locked by its moderators.', hide: 'Hide this reader', hidden: 'Hidden readers', restore: 'Show all readers', report: 'Report on GitHub', session: 'Sign-in lasts for this app session, up to eight hours.' },
  'zh-Hans': { hint: '与 GitHub 读者共享的公开讨论。', empty: '留下第一条阅读心得吧。', login: '使用 GitHub 登录', signing: '请完成登录后返回这里。', cancel: '取消', logout: '退出登录', placeholder: '提个问题，或分享你的批注……', post: '发表评论', posting: '正在发表……', posted: '评论已发表。', more: '加载更多评论', refresh: '刷新', external: '在 GitHub 查看', public: '将以你的 GitHub 用户名公开发表。发表前，草稿仅保存在本机。', error: '连接失败。草稿已保留，请重试。', auth: '请重新登录，草稿已保留。', limited: 'GitHub 暂时繁忙，请稍后重试。', uncertain: '发表时连接中断。再次发送前，请先在 GitHub 确认是否已发表。', popup: '请允许打开登录窗口，然后重试。', cancelled: '登录已取消或过期，可稍后重试。', setup: '应用内登录正在配置中，暂时可在 GitHub 参与讨论。', locked: '管理员已锁定此讨论。', hide: '隐藏此读者', hidden: '已隐藏的读者', restore: '显示所有读者', report: '在 GitHub 举报', session: '登录仅在本次应用会话有效，最长八小时。' },
  'zh-Hant': { hint: '與 GitHub 讀者共享的公開討論。', empty: '留下第一則閱讀心得吧。', login: '使用 GitHub 登入', signing: '請完成登入後返回這裡。', cancel: '取消', logout: '登出', placeholder: '提個問題，或分享你的批註……', post: '發表評論', posting: '正在發表……', posted: '評論已發表。', more: '載入更多評論', refresh: '重新整理', external: '在 GitHub 查看', public: '將以你的 GitHub 使用者名稱公開發表。發表前，草稿僅儲存在本機。', error: '連線失敗。草稿已保留，請重試。', auth: '請重新登入，草稿已保留。', limited: 'GitHub 暫時忙碌，請稍後重試。', uncertain: '發表時連線中斷。再次傳送前，請先在 GitHub 確認是否已發表。', popup: '請允許開啟登入視窗，然後重試。', cancelled: '登入已取消或過期，可稍後重試。', setup: '應用程式內登入正在設定中，暫時可在 GitHub 參與討論。', locked: '管理員已鎖定此討論。', hide: '隱藏此讀者', hidden: '已隱藏的讀者', restore: '顯示所有讀者', report: '在 GitHub 檢舉', session: '登入僅在本次應用程式工作階段有效，最長八小時。' },
  ja: { hint: 'GitHub の読者と共有する公開の会話です。', empty: '最初の感想を残してみましょう。', login: 'GitHub でログイン', signing: 'ログインを完了して、ここに戻ってください。', cancel: 'キャンセル', logout: 'ログアウト', placeholder: '質問や注釈を書きましょう…', post: 'コメントを投稿', posting: '投稿中…', posted: 'コメントを投稿しました。', more: '続きを読み込む', refresh: '更新', external: 'GitHub で見る', public: 'GitHub のユーザー名で公開されます。投稿するまで下書きはこの端末に保存されます。', error: '接続できません。下書きは保存されています。もう一度お試しください。', auth: '再度ログインしてください。下書きは保存されています。', limited: 'GitHub が混み合っています。少し待ってからお試しください。', uncertain: '投稿中に接続が切れました。再送信する前に GitHub で投稿を確認してください。', popup: 'ログインウィンドウを許可して、もう一度お試しください。', cancelled: 'ログインがキャンセルされたか期限が切れました。再度お試しください。', setup: 'アプリ内ログインを準備中です。今は GitHub から会話に参加できます。', locked: '管理者がこの会話をロックしています。', hide: 'この読者を非表示', hidden: '非表示の読者', restore: 'すべての読者を表示', report: 'GitHub で報告', session: 'ログインはアプリの今回の起動中、最大8時間有効です。' },
}
function stored(key: string) { try { return localStorage.getItem(key) ?? '' } catch { return '' } }
function save(key: string, value: string) { try { if (value) localStorage.setItem(key, value); else localStorage.removeItem(key) } catch { /* Reading works without storage. */ } }

export function Discussion({ passage, excerpt, ui }: { passage: string; excerpt: string; ui: UILanguage }) {
  const t = labels[ui], user = useSyncExternalStore(subscribeSession, currentUser)
  const draftKey = `bunko:discussion-draft:${passage}`
  const [draft, setDraft] = useState(() => stored(draftKey))
  const [thread, setThread] = useState<DiscussionThread>({ issue: null, comments: [], nextPage: null })
  const [hidden, setHidden] = useState(() => stored('bunko:hidden-readers').split(',').filter(Boolean))
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [signing, setSigning] = useState(false)
  const [error, setError] = useState(''), [posted, setPosted] = useState(false)
  const auth = useRef<ReturnType<typeof signIn> | null>(null)
  const posting = useRef(false)
  const attempt = useRef<{ body: string; id: string; excerpt: string } | null>((() => { try { const value = JSON.parse(stored(draftKey + ':attempt')); return typeof value?.body === 'string' && typeof value?.excerpt === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value?.id) ? value : null } catch { return null } })())
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; auth.current?.cancel() } }, [])
  useEffect(() => {
    const controller = new AbortController()
    readDiscussion(passage, 1, controller.signal).then(setThread).catch(() => { if (!controller.signal.aborted) setError('offline') }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [passage])
  const message = error === 'sign_in_again' ? t.auth : ['rate_limited', 'github_limited', 'thread_busy'].includes(error) ? t.limited : error === 'post_uncertain' ? t.uncertain : error === 'popup_blocked' ? t.popup : ['authorization_cancelled', 'flow_expired'].includes(error) ? t.cancelled : ['not_configured', 'update_required'].includes(error) ? t.setup : error === 'thread_locked' ? t.locked : t.error
  const errorCode = (reason: unknown) => reason instanceof DiscussionError ? reason.code : 'offline'
  async function load(more = false) {
    setLoading(true); setError('')
    try {
      const result = await readDiscussion(passage, more ? thread.nextPage ?? 1 : 1)
      if (mounted.current) setThread(old => more ? { ...result, comments: [...old.comments, ...result.comments.filter(c => !old.comments.some(previous => previous.id === c.id))] } : result)
    } catch (reason) { if (mounted.current) setError(errorCode(reason)) }
    finally { if (mounted.current) setLoading(false) }
  }
  async function login() {
    if (auth.current) return
    setError(''); setSigning(true)
    const flow = signIn(); auth.current = flow
    try { await flow.promise } catch (reason) { if (mounted.current) setError(errorCode(reason)) }
    finally { auth.current = null; if (mounted.current) setSigning(false) }
  }
  async function post() {
    if (posting.current || !draft.trim()) return
    posting.current = true; setBusy(true); setError(''); setPosted(false)
    // Reuse the request ID on retry; a failed response must never create two comments.
    if (!attempt.current || attempt.current.body !== draft) attempt.current = { body: draft, id: requestId(), excerpt }
    save(draftKey + ':attempt', JSON.stringify(attempt.current))
    try {
      const result = await postDiscussion(passage, attempt.current.excerpt, draft, attempt.current.id)
      save(draftKey, ''); save(draftKey + ':attempt', '')
      if (mounted.current) {
        setThread(old => ({ ...old, issue: result.issue, comments: result.comment ? [...old.comments.filter(c => c.id !== result.comment?.id), result.comment] : old.comments }))
        setDraft(''); setPosted(true)
      }
      attempt.current = null
    } catch (reason) { if (mounted.current) setError(errorCode(reason)) }
    finally { posting.current = false; if (mounted.current) setBusy(false) }
  }
  const url = thread.issue?.html_url ?? discussionNewUrl(passage, excerpt)
  const hide = (name: string) => { const next = [...new Set([...hidden, name])]; setHidden(next); save('bunko:hidden-readers', next.join(',')) }
  const comments = [...(thread.issue ? [{ ...thread.issue, body: thread.issue.body.split('\n\n').slice(2).join('\n\n') }] : []), ...thread.comments]
  return <section className="native-discussion" aria-busy={busy}>
    <p className="panel-hint">{t.hint}</p>
    <div className="discussion-toolbar"><a className="panel-link" href={url} target="_blank" rel="noopener noreferrer">{t.external} <ArrowUpRight size={14} /></a><button type="button" disabled={loading || busy} onClick={() => void load()}>{t.refresh}</button></div>
    {loading && <p className="panel-hint" role="status">…</p>}
    {!loading && !thread.issue && !error && <div className="discussion-empty"><span aria-hidden="true">“</span><p>{t.empty}</p></div>}
    <div className="discussion-comments">{comments.filter(comment => !hidden.includes(comment.user.login)).map(comment => <article key={comment.id}>
      <header><strong>@{comment.user.login}</strong>{comment.created_at && <time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleDateString(ui === 'zh-Hans' ? 'zh-CN' : ui === 'zh-Hant' ? 'zh-TW' : ui)}</time>}</header>
      <p>{comment.body}</p><details><summary>⋯</summary><button type="button" onClick={() => hide(comment.user.login)}>{t.hide}</button><a href={comment.html_url ?? url} target="_blank" rel="noopener noreferrer">{t.report}</a></details>
    </article>)}</div>
    {thread.nextPage && <button type="button" className="discussion-more" disabled={loading} onClick={() => void load(true)}>{t.more}</button>}
    {hidden.length > 0 && <button type="button" className="discussion-more" onClick={() => { setHidden([]); save('bunko:hidden-readers', '') }}>{t.hidden}: {hidden.length} · {t.restore}</button>}
    <div className="discussion-compose">
      {user ? <div className="discussion-account"><strong><LogIn size={16} /> @{user.login}</strong><button type="button" disabled={busy} onClick={() => { void signOut().catch(() => {}) }}>{t.logout}</button></div> : <button className="panel-cta github-signin" type="button" disabled={signing} onClick={() => void login()}><LogIn size={17} /> {t.login}</button>}
      {signing && <div className="panel-hint" role="status">{t.signing} <button type="button" onClick={() => auth.current?.cancel()}>{t.cancel}</button></div>}
      <textarea aria-label={t.placeholder} placeholder={t.placeholder} value={draft} maxLength={5000} rows={4} disabled={busy} onChange={event => { setDraft(event.target.value); save(draftKey, event.target.value); setPosted(false) }} />
      <p className="panel-hint discussion-privacy">{t.public}</p>
      <div className="discussion-submit"><small>{draft.length}/5000</small><button type="button" className="panel-cta" disabled={!user || !draft.trim() || busy || !!thread.issue?.locked || error === 'post_uncertain'} onClick={() => void post()}><Send size={15} /> {busy ? t.posting : t.post}</button></div>
      {thread.issue?.locked && <p className="panel-hint">{t.locked}</p>}
      {user && <small className="panel-hint">{t.session}</small>}
    </div>
    {error && <p className="discussion-error" role="alert">{message}</p>}
    {posted && <p className="discussion-success" role="status">{t.posted}</p>}
  </section>
}
