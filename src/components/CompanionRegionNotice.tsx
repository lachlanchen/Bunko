import type { UILanguage } from '../i18n'
import { refreshCompanionAvailability, type CompanionAvailability } from '../lib/companionRegion'
const copy = {
  en: { mainland: 'The reading companion is unavailable in mainland China. Books, dictionaries and discussions are still available.', checking: 'Checking reading companion availability…', other: 'The reading companion is unavailable until your region can be confirmed. Reading is still available.', retry: 'Check again' },
  'zh-Hans': { mainland: '中国大陆暂不提供阅读助手。书籍、词典和讨论仍可正常使用。', checking: '正在检查阅读助手的可用性…', other: '确认所在地区后才可使用阅读助手。你仍可正常阅读。', retry: '重新检查' },
  'zh-Hant': { mainland: '中國大陸暫不提供閱讀助手。書籍、詞典和討論仍可正常使用。', checking: '正在檢查閱讀助手的可用性…', other: '確認所在地區後才可使用閱讀助手。你仍可正常閱讀。', retry: '重新檢查' },
  ja: { mainland: '中国本土では読書コンパニオンを利用できません。本、辞書、コメントは引き続き利用できます。', checking: '読書コンパニオンの提供地域を確認中…', other: '地域を確認できるまで読書コンパニオンを利用できません。読書は引き続き利用できます。', retry: '再確認' },
}
export function CompanionRegionNotice({ availability, ui }: { availability: CompanionAvailability; ui: UILanguage }) {
  const c = copy[ui]
  return <div className="companion-region-notice" role="status"><p>{availability.reason === 'mainland' ? c.mainland : availability.reason === 'checking' ? c.checking : c.other}</p>{!['checking', 'mainland'].includes(availability.reason) && <button type="button" onClick={() => void refreshCompanionAvailability()}>{c.retry}</button>}</div>
}
