import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { agentCall } from '../lib/documentAgent'
import { useBackAction } from '../lib/backNavigation'
import type { UILanguage } from '../i18n'

const copy = {
  en: ['Assistant models', 'Primary model', 'Fallback model', 'None', 'Save', 'Configured and qualified models only. Fallback is limited to temporary provider failures.', 'Saved', 'Refresh'],
  'zh-Hans': ['助手模型', '主要模型', '备用模型', '无', '保存', '仅可选择已配置并验证的模型。仅在服务商临时故障时使用备用模型。', '已保存', '刷新'],
  'zh-Hant': ['助手模型', '主要模型', '備用模型', '無', '儲存', '僅可選擇已設定並驗證的模型。僅在服務商暫時故障時使用備用模型。', '已儲存', '重新整理'],
  ja: ['アシスタントのモデル', '優先モデル', '代替モデル', 'なし', '保存', '設定・確認済みのモデルのみ選択できます。一時的なプロバイダー障害時のみ代替を使います。', '保存しました', '再読み込み'],
}
interface Configuration { primary: string; fallback: string; revision: number; catalog: { id: string; label: string; use: string; available: boolean }[] }
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
      void agentCall<Configuration>('models', { save: true, primary: value.primary, fallback: value.fallback, revision: value.revision })
        .then(v => { setValue(v); setNotice(t[6]) }).catch((e: Error & { detail?: string }) => setNotice(e.detail || e.message)).finally(() => setBusy(false))
    }}>
      {(['primary', 'fallback'] as const).map((field, i) => <label className="guide-scope" key={field}>{t[i + 1]}
        <select value={value[field]} disabled={busy} onChange={e => setValue({ ...value, [field]: e.target.value })}>
          {field === 'fallback' && <option value="">{t[3]}</option>}
          {value.catalog.map(m => <option key={m.id} value={m.id} disabled={!m.available}>{m.label}{m.available ? '' : ' · unavailable'}</option>)}
        </select>
      </label>)}
      <button type="submit" disabled={busy}>{t[4]}</button>
      <button type="button" disabled={busy} onClick={() => { void agentCall<Configuration>('models').then(setValue).catch(() => setNotice('Unable to refresh.')) }}>{t[7]}</button>
    </form>}
    {notice && <p role="status">{notice}</p>}
  </main>
}
