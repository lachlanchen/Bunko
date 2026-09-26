import type { UILanguage } from '../i18n'

const en = {
  title: 'A fresh page for Bunko',
  webBody: 'An update is ready. Reload when you’re ready; your saved books, notes and settings stay on this device.',
  nativeBody: 'A newer version is available in the store. Update whenever you’re ready.',
  later: 'Later', reload: 'Update & reload', store: 'Open store',
  heading: 'App updates', installed: 'Installed version', check: 'Check for updates',
  checking: 'Checking for updates…', current: 'You’re up to date.',
  nativeCurrent: 'No newer public release is available for this app.',
  error: 'Couldn’t check for updates. Try again when you’re online; you can keep reading.',
  unsupported: 'Update checks are unavailable in this browser. Reopen Bunko online for the latest web version.',
  safe: 'Return to the library and finish any downloads before reloading.',
  applying: 'Applying update…', available: 'Update available',
}
type Copy = typeof en
export const updateCopies: Record<UILanguage, Copy> = {
  en,
  'zh-Hans': {
    title: '文库有更新了',
    webBody: '新版已准备好，可在方便时更新并重新载入。已保存的书籍、笔记和设置仍保留在本机。',
    nativeBody: '应用商店已有新版本，方便时再更新即可。',
    later: '稍后', reload: '更新并重新载入', store: '打开应用商店',
    heading: '应用更新', installed: '当前版本', check: '检查更新', checking: '正在检查更新…',
    current: '已是最新版本。', nativeCurrent: '目前没有比当前版本更新的正式发行版。',
    error: '无法检查更新。联网后可再试，仍可继续阅读。',
    unsupported: '此浏览器暂不支持检查更新。联网后重新打开文库，即可使用最新网页版。',
    safe: '请返回书库并等待下载完成后，再重新载入。', applying: '正在更新…', available: '有可用更新',
  },
  'zh-Hant': {
    title: '文庫有更新了',
    webBody: '新版已準備好，可在方便時更新並重新載入。已儲存的書籍、筆記和設定仍保留在本機。',
    nativeBody: '應用程式商店已有新版本，方便時再更新即可。',
    later: '稍後', reload: '更新並重新載入', store: '開啟應用程式商店',
    heading: '應用程式更新', installed: '目前版本', check: '檢查更新', checking: '正在檢查更新…',
    current: '已是最新版本。', nativeCurrent: '目前沒有比此版本更新的正式發行版。',
    error: '無法檢查更新。連線後可再試，仍可繼續閱讀。',
    unsupported: '此瀏覽器暫不支援檢查更新。連線後重新開啟文庫，即可使用最新網頁版。',
    safe: '請返回書庫並等待下載完成後，再重新載入。', applying: '正在更新…', available: '有可用更新',
  },
  ja: {
    title: '文庫の新しいページへ',
    webBody: '更新の準備ができました。お好きなタイミングで再読み込みできます。保存した本、メモ、設定はこの端末に残ります。',
    nativeBody: 'ストアで新しいバージョンを公開しています。ご都合のよいときに更新してください。',
    later: 'あとで', reload: '更新して再読み込み', store: 'ストアを開く',
    heading: 'アプリの更新', installed: '現在のバージョン', check: '更新を確認', checking: '更新を確認中…',
    current: '最新の状態です。', nativeCurrent: '現在のバージョンより新しい正式版はありません。',
    error: '更新を確認できませんでした。オンラインで再度お試しください。読書は続けられます。',
    unsupported: 'このブラウザでは更新を確認できません。オンラインで文庫を開き直すと最新のウェブ版を利用できます。',
    safe: '書庫に戻り、ダウンロードが完了してから再読み込みしてください。', applying: '更新中…', available: '更新があります',
  },
}
