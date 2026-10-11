import { languageName, type UILanguage } from '../i18n'

const hints = {
  en: '1 is the main text. Select more languages in reading order; keep at least one.',
  'zh-Hans': '1 是主文。按阅读顺序添加其他语言，至少保留一种。',
  'zh-Hant': '1 是主文。依閱讀順序加入其他語言，至少保留一種。',
  ja: '1 が本文です。読みたい順に言語を追加し、少なくとも1つ残してください。',
}

export function LanguageChoices({ available, selected, ui, onChange }: {
  available: string[]; selected: string[]; ui: UILanguage; onChange: (languages: string[]) => void
}) {
  const filtered = [...new Set(selected)].filter(lang => available.includes(lang))
  const ordered = filtered.length ? filtered : available.slice(0, 1)
  return <>
    <div className="chips language-choices">
      {available.map(lang => {
        const index = ordered.indexOf(lang), on = index >= 0, last = on && ordered.length === 1
        return <button key={lang} type="button" aria-pressed={on} aria-disabled={last || undefined}
          aria-label={`${languageName(lang, ui)}${on ? `, ${index + 1}` : ''}`}
          className={on ? `active ${index === 0 ? 'main-language' : 'translation-language'}` : ''}
          onClick={() => { if (!last) onChange(on ? ordered.filter(item => item !== lang) : [...ordered, lang]) }}>
          {on && <span className="language-order" aria-hidden="true">{index + 1}</span>}{languageName(lang, ui)}
        </button>
      })}
    </div>
    <p className="hint">{hints[ui]}</p>
  </>
}
