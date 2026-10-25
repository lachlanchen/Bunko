import { AppError, requireValue } from './common.mjs'

// Model names are server configuration, never an instruction from a book/chat.
export const modelCatalog = Object.freeze([
  { id: 'deepseek-flash', provider: 'DeepSeek', label: 'DeepSeek 4.1 Flash', use: 'Everyday reading and visual guides', reasoning: 'disabled' },
  { id: 'deepseek-v4-pro', provider: 'DeepSeek', label: 'DeepSeek Pro', use: 'Detailed reading and structured guides', reasoning: 'disabled' },
  { id: 'gpt-6-luna', provider: 'OpenAI', label: 'GPT-6 Luna', use: 'Low-cost everyday questions', reasoning: 'low' },
  { id: 'gpt-5.6-terra', provider: 'OpenAI', label: 'GPT-5.6 Terra', use: 'Balanced everyday assistance', reasoning: 'low' },
  { id: 'gpt-6.1-sol', provider: 'OpenAI', label: 'GPT-6.1 Sol', use: 'Balanced reasoning and structured guides', reasoning: 'low' },
  { id: 'gpt-6-astra', provider: 'OpenAI', label: 'GPT-6 Astra', use: 'Difficult questions; higher cost', reasoning: 'low' },
])
const endpoints = { DeepSeek: 'https://api.deepseek.com/chat/completions', OpenAI: 'https://api.openai.com/v1/chat/completions' }

/** Small explicit transport boundary inspired by AiMemo's qualified model routes.
 * No ambient credentials, tools, CLI fallback or model-selected endpoints.
 * An app-owned durable request/ledger remains outside this read-only boundary.
 */
export function createModelRouter({ db, config, provider, now = Date.now }) {
  db.exec('CREATE TABLE IF NOT EXISTS agent_model_settings(id INTEGER PRIMARY KEY CHECK(id=1),data TEXT NOT NULL)')
  const routes = new Map()
  for (const item of modelCatalog) {
    const credential = config.models?.providers?.[item.provider.toLowerCase()]
    if (credential?.token && credential.qualifiedModels?.includes(item.id)) routes.set(item.id, { ...item, token: credential.token, url: endpoints[item.provider] })
  }
  // Preserve a previously configured, qualified deployment, including private gateways.
  if (config.model?.url && config.model?.name) {
    const known = modelCatalog.find(m => m.id === config.model.name)
    const host = new URL(config.model.url).hostname
    const providerName = known?.provider || (host === 'api.deepseek.com' ? 'DeepSeek' : host === 'api.openai.com' ? 'OpenAI' : 'Configured provider')
    routes.set(config.model.name, { ...(known || { id: config.model.name, provider: providerName, label: config.model.name, use: 'Existing configured route' }), ...config.model })
  }
  const fallbackDefault = routes.has('deepseek-flash') ? 'deepseek-flash' : config.model?.name || ''
  const capableDefault = routes.has(config.models?.capable) ? config.models.capable : ''
  const defaults = { primary: fallbackDefault, fallback: capableDefault, capable: capableDefault, revision: 0 }
  const read = () => {
    try { return { ...defaults, ...JSON.parse(db.prepare('SELECT data FROM agent_model_settings WHERE id=1').get()?.data) } } catch { return defaults }
  }
  const isAdmin = user => user?.kind !== 'demo' && Array.isArray(config.models?.adminUserIds) && config.models.adminUserIds.some(id => String(id) === String(user?.id))
  const selection = (scope = {}) => {
    if (!scope.deepseekOnly) return read()
    // Pin actual transport, including fallback/repair. A model label on a
    // private gateway is not sufficient to select this route.
    const qualified = id => routes.get(id)?.provider === 'DeepSeek' && routes.get(id)?.url === endpoints.DeepSeek
    const primary = qualified('deepseek-flash') ? 'deepseek-flash' : qualified('deepseek-v4-pro') ? 'deepseek-v4-pro' : ''
    const capable = qualified('deepseek-v4-pro') ? 'deepseek-v4-pro' : primary
    return { primary, capable, fallback: capable !== primary ? capable : '' }
  }
  const policy = (scope) => {
    const value = selection(scope)
    const providers = [...new Set([value.primary, value.fallback, value.capable].filter(Boolean).map(id => routes.get(id)?.provider).filter(Boolean))]
    return { providers, consentKey: providers.slice().sort().join('|') }
  }
  const admin = (user, input = {}) => {
    requireValue(isAdmin(user), 'Administrator access is required.', 403)
    if (input.save === true) {
      const previous = read()
      requireValue(input.revision === previous.revision, 'Model settings changed. Refresh before saving.', 409)
      requireValue(routes.has(input.primary) && (!input.fallback || routes.has(input.fallback)), 'Qualify and configure the model before enabling it.')
      requireValue(!input.fallback || input.primary !== input.fallback, 'Choose a different fallback.')
      const capable = input.capable === undefined ? previous.capable : input.capable
      requireValue(!capable || routes.has(capable), 'Qualify and configure the model before enabling it.')
      const next = { primary: input.primary, fallback: input.fallback || '', capable, revision: previous.revision + 1 }
      db.prepare('INSERT OR REPLACE INTO agent_model_settings VALUES(1,?)').run(JSON.stringify(next))
    }
    return { ...read(), catalog: [...modelCatalog, ...[...routes.values()].filter(r => !modelCatalog.some(m => m.id === r.id))]
      .map(({ id, label, use, provider: name }) => ({ id, label, use, provider: name, available: routes.has(id) })) }
  }
  const forRequest = (consent = ['DeepSeek', 'Configured provider'], scope) => {
    const settings = selection(scope) // Freeze this request's selection across repair attempts.
    const allowed = new Set(Array.isArray(consent) ? consent.filter(v => typeof v === 'string') : [])
    return async (_legacyUrl, options = {}) => {
      // Only host validation can request the one bounded repair with a stronger model.
      // Book text and model output cannot select a route or add a provider.
      const primary = options.quality === 'repair' && settings.capable ? settings.capable : settings.primary
      const candidates = [...new Set([primary, settings.fallback].filter(Boolean))].map(id => routes.get(id))
      requireValue(candidates[0], 'The reading assistant is not connected.', 503)
      const raw = JSON.parse(options.body)
      const deadline = now() + Math.min(options.timeout || 60000, 110000)
      for (let i = 0; i < candidates.length; i++) {
        const route = candidates[i]
        requireValue(route && allowed.has(route.provider), 'Review the assistant provider notice before sending this question.', 409)
        const body = { ...raw, model: route.id, stream: false }
        delete body.think; delete body.thinking; delete body.reasoning_effort; delete body.quality
        if (route.provider === 'OpenAI') {
          delete body.temperature
          body.max_completion_tokens = Math.max(4096, raw.max_tokens || 4096)
          delete body.max_tokens
          body.reasoning_effort = route.reasoning || 'low'
        } else if (route.provider === 'DeepSeek') body.thinking = { type: 'disabled' }
        const remaining = deadline - now()
        requireValue(remaining > 0 && !options.signal?.aborted, 'The reading request was interrupted.', 504)
        try {
          const transportOptions = { ...options }; delete transportOptions.quality
          return await provider(route.url, { ...transportOptions, timeout: remaining,
            headers: { 'Content-Type': 'application/json', ...(route.token ? { Authorization: `Bearer ${route.token}` } : {}) },
            body: JSON.stringify(body) })
        } catch (error) {
          // Only a declared transient provider failure may use a configured fallback.
          // Never replay a cancellation, validation failure or application mutation.
          if (options.signal?.aborted || i + 1 === candidates.length || error?.retryable !== true || now() >= deadline) throw error
        }
      }
      throw new AppError('The reading assistant is unavailable.', 503)
    }
  }
  return { isAdmin, policy, admin, forRequest }
}
