import type { UILanguage } from '../i18n'

export function bookShareURL(id: string, ui: UILanguage) {
  return `https://bunko.lazying.art/bunko/share/book/${encodeURIComponent(id)}/${ui}`
}
