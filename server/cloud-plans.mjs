// Cloud features only. Book access, dictionaries and offline reading do not
// consult this catalog. App-specific products cannot grant another app's plan.
export const plans = Object.freeze([
  { id: 'reader', name: 'Reader', targetUSD: '2.99', pages: 200, agentTurns: 40, apple: 'art.lazying.bunko.reader.monthly', google: 'bunko_reader_monthly', stripe: 'bunko_reader_monthly_v1' },
  { id: 'researcher', name: 'Researcher', targetUSD: '14.99', pages: 1200, agentTurns: 80, apple: 'art.lazying.bunko.researcher.monthly', google: 'bunko_researcher_monthly', stripe: 'bunko_researcher_monthly_v1' },
  { id: 'studio', name: 'Studio', targetUSD: '29.99', pages: 2600, agentTurns: 160, apple: 'art.lazying.bunko.studio.monthly', google: 'bunko_studio_monthly', stripe: 'bunko_studio_monthly_v1' },
])
export const planForProduct = (platform, product) => plans.find(plan => plan[platform] === product)
export const trialPolicy = Object.freeze({ days: 7, pages: 50, agentTurns: 10 })
export const freeQuota = Object.freeze({ pages: 30, agentTurns: 10 })
