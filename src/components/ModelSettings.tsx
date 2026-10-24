import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { agentCall } from '../lib/documentAgent'
import { useBackAction } from '../lib/backNavigation'
import type { UILanguage } from '../i18n'

const copy = {
  en: ['Assistant models', 'Default', 'For harder questions', 'None', 'Save', 'Starts with the default. Uses the stronger model if an answer needs repair or the service is busy.', 'Saved', 'Refresh'],
  'zh-Hans': ['助手模型', '默认', '更复杂的问题', '无', '保存', '先使用默认模型。答案需要修正或服务繁忙时，再使用更强的模型。', '已保存', '刷新'],
  'zh-Hant': ['助手模型', '預設', '較複雜的問題', '無', '儲存', '先使用預設模型。答案需要修正或服務繁忙時，再使用更強的模型。', '已儲存', '重新整理'],
  ja: ['アシスタントのモデル', '通常', '難しい質問', 'なし', '保存', '通常のモデルから開始し、回答の修正が必要なときや混雑時に高性能モデルを使います。', '保存しました', '再読み込み'],
}
interface Configuration { primary: string; fallback: string; capable: string; revision: number; catalog: { id: string; label: string; use: string; available: boolean }[] }
export function ModelSettings({ ui, onBack }: { ui: UILanguage; onBack: () => void }) {
  const t = copy[ui], [value, setValue] = useState<Configuration | null>(null), [busy, setBusy] = useState(false), [notice, setNotice] = useState('')
  useBackAction(onBack, true, 40)
  useEffect(() => {
    let active = true
    void agentCall<Configuration>('models').then(v => { if (active) setValue(v) }).catch(() => { if (active) setNotice('Unable to load model settings.') })
    return () => { active = false }
  }, [])
  return <main className="agent-page model-settings">
    <header className="agent-header"><button type="button" className="agent-icon-button" onClick={onBack} aria-label={t[0]}><ArrowLeft size={20} /></button><h1>{t[0]}</h1></header>
    <p>{t[5]}</p>
    {value && <form onSubmit={e => {
      e.preventDefault(); setBusy(true); setNotice('')
      void agentCall<Configuration>('models', { save: true, primary: value.primary, fallback: value.capable, capable: value.capable, revision: value.revision })
        .then(v => { setValue(v); setNotice(t[6]) }).catch((e: Error & { detail?: string }) => setNotice(e.detail || e.message)).finally(() => setBusy(false))
    }}>
      {(['primary', 'capable'] as const).map((field, i) => <label className="guide-scope" key={field}>{t[i + 1]}
        <select value={value[field]} disabled={busy} onChange={e => setValue({ ...value, [field]: e.target.value })}>
          {field === 'capable' && <option value="">{t[3]}</option>}
          {value.catalog.map(m => <option key={m.id} value={m.id} disabled={!m.available}>{m.label}{m.available ? '' : ' · unavailable'}</option>)}
        </select>
      </label>)}
      <button type="submit" disabled={busy}>{t[4]}</button>
      <button type="button" disabled={busy} onClick={() => { void agentCall<Configuration>('models').then(setValue).catch(() => setNotice('Unable to refresh.')) }}>{t[7]}</button>
    </form>}
    {notice && <p role="status">{notice}</p>}
  </main>
}
