import { RefreshCw } from 'lucide-react'
import type { UILanguage } from '../i18n'
import { updateCopies } from '../lib/updateCopy'
import type { Updates } from '../lib/updateService'
import { STORE_URLS } from '../lib/updates'

type Props = { ui: UILanguage; updates: Updates; canReload: boolean }

function UpdateAction({ ui, updates, canReload }: Props) {
  const copy = updateCopies[ui]
  if (updates.platform !== 'web') return <a className="button primary" href={STORE_URLS[updates.platform]} target="_blank" rel="noopener noreferrer" onClick={updates.dismiss}>{copy.store} ↗</a>
  return <button type="button" className="primary" disabled={!canReload || updates.applying} onClick={() => { if (canReload) updates.applyWeb() }}>{updates.applying ? copy.applying : copy.reload}</button>
}

export function UpdatePrompt(props: Props) {
  const { updates, ui, canReload } = props
  const copy = updateCopies[ui]
  if (!updates.candidate || updates.snoozed || !canReload) return null
  return <aside className="update-prompt" aria-label={copy.available}>
    <RefreshCw size={20} aria-hidden="true" />
    <div>
      <strong>{copy.title}{updates.candidate.version ? ` · ${updates.candidate.version}` : ''}</strong>
      <p>{updates.platform === 'web' ? copy.webBody : copy.nativeBody}</p>
      <div className="update-actions">
        <UpdateAction {...props} />
        <button type="button" onClick={updates.dismiss} disabled={updates.applying}>{copy.later}</button>
      </div>
    </div>
  </aside>
}

export function UpdateSettings(props: Props) {
  const { updates, ui, canReload } = props
  const copy = updateCopies[ui]
  const status = updates.status === 'checking' ? copy.checking
    : updates.status === 'error' ? copy.error
      : updates.status === 'unsupported' ? copy.unsupported
        : updates.candidate ? `${copy.available}${updates.candidate.version ? ` · ${updates.candidate.version}` : ''}`
          : updates.status === 'current' ? (updates.platform === 'web' ? copy.current : copy.nativeCurrent) : ''
  return <section className="update-settings" aria-label={copy.heading}>
    <h3>{copy.heading}</h3>
    <p className="hint">{copy.installed}: <strong>{updates.version}{updates.build ? ` (${updates.build})` : ''}</strong></p>
    <p className="hint" role="status">{status}</p>
    <div className="update-actions">
      <button type="button" onClick={() => void updates.check(true)} disabled={updates.status === 'checking' || updates.applying || updates.status === 'unsupported'}><RefreshCw size={14} className={updates.status === 'checking' ? 'spinning' : ''} />{copy.check}</button>
      {updates.candidate && <UpdateAction {...props} />}
    </div>
    {updates.candidate && updates.platform === 'web' && !canReload && <p className="hint">{copy.safe}</p>}
  </section>
}
