import { useEffect, useRef, useState } from 'react'
import type { UILanguage } from '../i18n'
import { DiscussionError, signInDemo } from '../lib/discussions'
import './demoAccount.css'

const copy = {
  en: { title: 'Demo account', intro: 'For invited testers and store review. Enter the Bunko demo credentials supplied with your invitation or review notes. No email code is needed.', username: 'Demo username', password: 'Demo password', login: 'Sign in to demo', busy: 'Signing in…', cancel: 'Cancel', invalid: 'Check the demo username and password.', unavailable: 'Demo access is not available in this build yet. Please use the build named in your invitation or review notes.', limited: 'Too many attempts. Please wait 15 minutes before trying again.', error: 'Could not sign in. Check your connection and try again.', notice: 'Demo account: documents and conversations are shared with other demo testers. Use non-sensitive files. Comments are public on GitHub and labelled “Bunko demo account”.' },
  'zh-Hans': { title: '演示账户', intro: '供受邀测试者和应用审核使用。请输入邀请或审核说明中的 Bunko 演示凭据，无需邮箱验证码。', username: '演示用户名', password: '演示密码', login: '登录演示账户', busy: '正在登录…', cancel: '取消', invalid: '请检查演示用户名和密码。', unavailable: '此版本暂不支持演示登录，请使用邀请或审核说明中指定的版本。', limited: '尝试次数过多，请等待 15 分钟后重试。', error: '登录失败，请检查网络后重试。', notice: '演示账户：文档和对话与其他演示测试者共享，请勿上传敏感文件。评论将公开发布到 GitHub，并标注“Bunko demo account”。' },
  'zh-Hant': { title: '示範帳戶', intro: '供受邀測試者及應用程式審查使用。請輸入邀請或審查說明中的 Bunko 示範憑據，無需信箱驗證碼。', username: '示範使用者名稱', password: '示範密碼', login: '登入示範帳戶', busy: '正在登入…', cancel: '取消', invalid: '請檢查示範使用者名稱和密碼。', unavailable: '此版本暫不支援示範登入，請使用邀請或審查說明中指定的版本。', limited: '嘗試次數過多，請等待 15 分鐘後重試。', error: '登入失敗，請檢查網路後重試。', notice: '示範帳戶：文件和對話與其他示範測試者共用，請勿上傳敏感檔案。評論將公開發佈至 GitHub，並標示「Bunko demo account」。' },
  ja: { title: 'デモアカウント', intro: '招待されたテスターとストア審査向けです。招待または審査メモに記載された Bunko のデモ認証情報を入力してください。メール確認コードは不要です。', username: 'デモユーザー名', password: 'デモパスワード', login: 'デモにログイン', busy: 'ログイン中…', cancel: 'キャンセル', invalid: 'デモユーザー名とパスワードを確認してください。', unavailable: 'このビルドではデモを利用できません。招待または審査メモに記載されたビルドをご利用ください。', limited: '試行回数が多すぎます。15分待ってから再度お試しください。', error: 'ログインできません。接続を確認して再度お試しください。', notice: 'デモアカウント：文書と会話は他のデモテスターと共有されます。機密ファイルは使用しないでください。コメントは GitHub に公開され、「Bunko demo account」と表示されます。' },
}

export function DemoNotice({ ui }: { ui: UILanguage }) {
  return <p className="demo-notice" role="note">{copy[ui].notice}</p>
}

export function DemoAccount({ ui, disabled = false, onBusy }: { ui: UILanguage; disabled?: boolean; onBusy?: (value: boolean) => void }) {
  const t = copy[ui]
  const [username, setUsername] = useState(''), [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const flow = useRef<ReturnType<typeof signInDemo> | null>(null), mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; flow.current?.cancel() } }, [])
  async function login() {
    if (flow.current || disabled) return
    setError(''); setBusy(true); onBusy?.(true)
    const attempt = signInDemo(username.trim(), password); flow.current = attempt
    setPassword('')
    try { await attempt.promise }
    catch (reason) {
      if (mounted.current) {
        const code = reason instanceof DiscussionError ? reason.code : ''
        setError(code === 'invalid_demo_credentials' ? t.invalid : code === 'rate_limited' ? t.limited : ['demo_unavailable', 'not_found'].includes(code) ? t.unavailable : code === 'authorization_cancelled' || (reason instanceof Error && reason.name === 'AbortError') ? '' : t.error)
      }
    } finally { flow.current = null; onBusy?.(false); if (mounted.current) setBusy(false) }
  }
  return <details className="demo-account">
    <summary>{t.title}</summary>
    <form onSubmit={e => { e.preventDefault(); void login() }}>
      <p>{t.intro}</p><DemoNotice ui={ui} />
      <label>{t.username}<input name="bunko-demo-username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={64} value={username} onChange={e => setUsername(e.target.value)} required disabled={busy || disabled} /></label>
      <label>{t.password}<input name="bunko-demo-password" type="password" autoComplete="current-password" maxLength={256} value={password} onChange={e => setPassword(e.target.value)} required disabled={busy || disabled} /></label>
      <div><button type="submit" disabled={busy || disabled || !username.trim() || !password}>{busy ? t.busy : t.login}</button>{busy && <button type="button" onClick={() => flow.current?.cancel()}>{t.cancel}</button>}</div>
      {error && <p role="alert">{error}</p>}
    </form>
  </details>
}
