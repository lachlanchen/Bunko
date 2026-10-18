import type { UILanguage } from '../i18n'
const en = {
  title: 'Reading plans', close: 'Back', intro: 'Read every book. Choose more help when you need it.',
  included: 'Your Bunko purchase includes books, dictionaries and offline reading. Reading plans are optional.',
  signIn: 'Sign in with GitHub', signingIn: 'Signing in…', cancel: 'Cancel',
  unavailable: 'Reading subscriptions are being prepared. Your current reading remains available.',
  error: 'Unable to load reading plans. Try again when connected.', retry: 'Try again',
  pages: 'PDF pages each month', answers: 'AI answers each day', planned: 'Planned monthly price', monthly: 'Monthly price',
  subscribe: 'Subscribe', soon: 'Coming soon', restore: 'Restore purchases', manage: 'Manage subscription',
  current: 'Current plan', usage: 'Your plan usage', remaining: 'remaining', unlimited: 'Unlimited owner allowance',
  resets: 'Page allowance resets', trial: 'Eligible subscribers get a seven-day trial with 50 PDF pages and 10 AI answers each day.',
  renewal: 'Monthly subscriptions renew until canceled. Manage or cancel through the store where you subscribed. Access lasts until the paid period ends.',
  restored: 'Your purchases are up to date.', signedOut: 'Sign in to see your plan usage.',
  blocked: 'You already have a purchase to manage. Restore it or open the store where you subscribed.',
  privacy: 'Privacy', terms: 'Terms', reader: 'Reader', researcher: 'Creator', studio: 'Entrepreneur',
}
export const cloudCopy: Record<UILanguage, typeof en> = {
  en,
  'zh-Hans': {
    title: '阅读方案', close: '返回', intro: '所有书籍照常阅读，需要时选择更多阅读助手用量。', included: '购买 Bunko 已包含图书、词典和离线阅读。阅读方案为可选服务。',
    signIn: '使用 GitHub 登录', signingIn: '正在登录…', cancel: '取消', unavailable: '阅读订阅正在准备中，现有阅读功能仍可使用。', error: '无法加载阅读方案，请联网后重试。', retry: '重试',
    pages: '每月 PDF 页数', answers: '每日 AI 回答', planned: '预计月费', monthly: '月费', subscribe: '订阅', soon: '即将推出', restore: '恢复购买', manage: '管理订阅', current: '当前方案', usage: '方案用量', remaining: '剩余', unlimited: '所有者无限额度', resets: '页数额度重置日期',
    trial: '符合条件的订阅者可免费试用七天，包含 50 页 PDF 和每日 10 次 AI 回答。', renewal: '月度订阅将自动续订，直至取消。请在原购买商店管理或取消订阅，权益保留至已付费周期结束。', restored: '购买记录已更新。', signedOut: '登录后查看方案用量。', blocked: '你已有需要管理的购买记录。请恢复购买或打开原购买商店。', privacy: '隐私', terms: '条款', reader: '阅读者', researcher: '创作者', studio: '创业者',
  },
  'zh-Hant': {
    title: '閱讀方案', close: '返回', intro: '所有書籍照常閱讀，需要時選擇更多閱讀助手用量。', included: '購買 Bunko 已包含圖書、詞典和離線閱讀。閱讀方案為可選服務。',
    signIn: '使用 GitHub 登入', signingIn: '正在登入…', cancel: '取消', unavailable: '閱讀訂閱正在準備中，現有閱讀功能仍可使用。', error: '無法載入閱讀方案，請連線後重試。', retry: '重試',
    pages: '每月 PDF 頁數', answers: '每日 AI 回答', planned: '預計月費', monthly: '月費', subscribe: '訂閱', soon: '即將推出', restore: '回復購買', manage: '管理訂閱', current: '目前方案', usage: '方案用量', remaining: '剩餘', unlimited: '擁有者無限額度', resets: '頁數額度重設日期',
    trial: '符合資格的訂閱者可免費試用七天，包含 50 頁 PDF 和每日 10 次 AI 回答。', renewal: '月度訂閱將自動續訂，直至取消。請在原購買商店管理或取消訂閱，權益保留至已付費週期結束。', restored: '購買記錄已更新。', signedOut: '登入後查看方案用量。', blocked: '你已有需要管理的購買記錄。請回復購買或開啟原購買商店。', privacy: '隱私', terms: '條款', reader: '閱讀者', researcher: '創作者', studio: '創業者',
  },
  ja: {
    title: '読書プラン', close: '戻る', intro: 'すべての本をそのまま読めます。必要に応じてアシスタントの利用枠を増やせます。', included: 'Bunko の購入には本・辞書・オフライン読書が含まれます。読書プランは任意です。',
    signIn: 'GitHub でログイン', signingIn: 'ログイン中…', cancel: 'キャンセル', unavailable: '読書プランは準備中です。現在の読書機能は引き続き使えます。', error: 'プランを読み込めません。接続後に再試行してください。', retry: '再試行',
    pages: '毎月の PDF ページ数', answers: '1 日の AI 回答数', planned: '予定月額', monthly: '月額', subscribe: '登録', soon: '近日公開', restore: '購入を復元', manage: 'サブスクリプションを管理', current: '現在のプラン', usage: 'プランの使用量', remaining: '残り', unlimited: '所有者の利用枠は無制限', resets: 'ページ利用枠の更新日',
    trial: '対象の方は 7 日間無料でお試しいただけます。PDF 50 ページと 1 日 10 回の AI 回答を含みます。', renewal: '月額プランは解約まで自動更新されます。購入したストアで管理・解約できます。支払済み期間の終了まで利用できます。', restored: '購入情報を更新しました。', signedOut: 'ログインして使用量を確認できます。', blocked: '管理が必要な購入があります。購入を復元するか、購入したストアを開いてください。', privacy: 'プライバシー', terms: '利用規約', reader: 'Reader', researcher: 'Creator', studio: 'Entrepreneur',
  },
}
