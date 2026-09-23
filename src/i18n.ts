/** Every visible string, in the four interface languages the app offers. */

export type UILanguage = 'en' | 'zh-Hans' | 'zh-Hant' | 'ja'

export interface UICopy {
  appName: string
  tagline: string
  library: string
  shelf: string
  reading: string
  settings: string
  search: string
  searchPlaceholder: string
  noResults: string
  allLanguages: string
  chinese: string
  japanese: string
  world: string
  onDevice: string
  chapters: string
  paragraphs: string
  download: string
  downloading: string
  downloaded: string
  remove: string
  removeConfirm: string
  open: string
  continueReading: string
  start: string
  offlineReady: string
  chapterList: string
  previous: string
  next: string
  finished: string
  show: string
  layout: string
  layoutSource: string
  layoutInterlinear: string
  layoutPaired: string
  ruby: string
  rubyHint: string
  grammar: string
  grammarHint: string
  textSize: string
  books: string
  refreshLibrary: string
  theme: string
  themePaper: string
  themeNight: string
  themeSystem: string
  serif: string
  interfaceLanguage: string
  storage: string
  storageUsed: string
  requestBook: string
  requestHint: string
  requestPlaceholder: string
  requestSend: string
  about: string
  aboutBody: string
  rights: string
  rightsBody: string
  loading: string
  offlineError: string
  retry: string
  back: string
  close: string
}

const en: UICopy = {
  appName: 'Bunko',
  tagline: 'Classics in three languages, with a reading above every character.',
  library: 'Library',
  shelf: 'My shelf',
  reading: 'Reading',
  settings: 'Settings',
  search: 'Search',
  searchPlaceholder: 'Title or author',
  noResults: 'Nothing here by that name.',
  allLanguages: 'All',
  chinese: 'Chinese canon',
  japanese: 'Japanese',
  world: 'World literature',
  onDevice: 'On this device',
  chapters: 'chapters',
  paragraphs: 'paragraphs',
  download: 'Download for offline',
  downloading: 'Downloading',
  downloaded: 'On this device',
  remove: 'Remove from device',
  removeConfirm: 'Remove the downloaded text? The book stays in the library.',
  open: 'Open',
  continueReading: 'Continue',
  start: 'Start reading',
  offlineReady: 'Ready to read offline',
  chapterList: 'Chapters',
  previous: 'Previous',
  next: 'Next',
  finished: 'End of the book.',
  show: 'Show',
  layout: 'Arrangement',
  layoutSource: 'Source only',
  layoutInterlinear: 'Interlinear',
  layoutPaired: 'Paragraph by paragraph',
  ruby: 'Readings',
  rubyHint: 'Furigana above kana, pinyin above hanzi.',
  grammar: 'Colour by grammar',
  grammarHint: 'Subject, predicate, object and the rest, as the generator labelled them.',
  textSize: 'Text size',
  books: 'books',
  refreshLibrary: 'Refresh library',
  theme: 'Theme',
  themePaper: 'Light',
  themeNight: 'Dark',
  themeSystem: 'Match device',
  serif: 'Serif text',
  interfaceLanguage: 'Interface language',
  storage: 'Storage',
  storageUsed: 'used on this device',
  requestBook: 'Request a book',
  requestHint: 'Public-domain titles only. This opens a GitHub issue; nothing is sent to us.',
  requestPlaceholder: 'Which book?',
  requestSend: 'Open the request',
  about: 'About',
  aboutBody:
    'Bunko reads public-domain classics with a reading above every character, in English, Chinese and Japanese. Everything is downloaded once and read offline; nothing you do here leaves your device.',
  rights: 'Rights',
  rightsBody:
    'Every book here is out of copyright. The modern Chinese, Japanese and English renderings were generated from those public-domain originals by LazyingArt LLC, which owns them.',
  loading: 'Loading',
  offlineError: 'Could not reach the library. Downloaded books still work.',
  retry: 'Try again',
  back: 'Back',
  close: 'Close',
}

const zhHans: UICopy = {
  ...en,
  appName: '文库',
  tagline: '三语经典，字字有音。',
  library: '书库',
  shelf: '我的书架',
  reading: '阅读',
  settings: '设置',
  search: '搜索',
  searchPlaceholder: '书名或作者',
  noResults: '没有找到这本书。',
  allLanguages: '全部',
  chinese: '中华经典',
  japanese: '日本文学',
  world: '世界文学',
  onDevice: '已下载',
  chapters: '章',
  paragraphs: '段',
  download: '下载以离线阅读',
  downloading: '下载中',
  downloaded: '已在本机',
  remove: '从本机删除',
  removeConfirm: '删除已下载的正文？书仍然留在书库里。',
  open: '打开',
  continueReading: '继续阅读',
  start: '开始阅读',
  offlineReady: '可离线阅读',
  chapterList: '目录',
  previous: '上一章',
  next: '下一章',
  finished: '全书完。',
  show: '显示',
  layout: '排列',
  layoutSource: '只看原文',
  layoutInterlinear: '逐句对照',
  layoutPaired: '整段对照',
  ruby: '注音',
  rubyHint: '汉字上标拼音，假名上标振假名。',
  grammar: '语法着色',
  grammarHint: '主语、谓语、宾语等，按生成时的标注。',
  textSize: '字号',
  books: '本书',
  refreshLibrary: '刷新书库',
  theme: '主题',
  themePaper: '纸色',
  themeNight: '夜间',
  themeSystem: '跟随系统',
  serif: '衬线字体',
  interfaceLanguage: '界面语言',
  storage: '存储',
  storageUsed: '已用于本机',
  requestBook: '申请新书',
  requestHint: '仅限公共领域作品。将打开 GitHub 议题，不会发送到我们的服务器。',
  requestPlaceholder: '想读哪本书？',
  requestSend: '提交申请',
  about: '关于',
  aboutBody:
    '文库让你读公共领域的经典，每个字上都有读音，支持英文、中文与日文。书籍下载一次即可离线阅读，你的一切操作都留在本机。',
  rights: '版权',
  rightsBody:
    '本应用收录的作品均已进入公共领域。现代中文、日文与英文译文由 LazyingArt LLC 根据公共领域原文生成并拥有。',
  loading: '加载中',
  offlineError: '无法连接书库，已下载的书仍可阅读。',
  retry: '重试',
  back: '返回',
  close: '关闭',
}

const zhHant: UICopy = {
  ...zhHans,
  appName: '文庫',
  tagline: '三語經典，字字有音。',
  library: '書庫',
  shelf: '我的書架',
  reading: '閱讀',
  settings: '設定',
  search: '搜尋',
  searchPlaceholder: '書名或作者',
  noResults: '沒有找到這本書。',
  allLanguages: '全部',
  chinese: '中華經典',
  japanese: '日本文學',
  world: '世界文學',
  onDevice: '已下載',
  download: '下載以離線閱讀',
  downloading: '下載中',
  downloaded: '已在本機',
  remove: '從本機刪除',
  removeConfirm: '刪除已下載的正文？書仍然留在書庫裡。',
  open: '開啟',
  continueReading: '繼續閱讀',
  start: '開始閱讀',
  offlineReady: '可離線閱讀',
  chapterList: '目錄',
  previous: '上一章',
  next: '下一章',
  finished: '全書完。',
  show: '顯示',
  layout: '排列',
  layoutSource: '只看原文',
  layoutInterlinear: '逐句對照',
  layoutPaired: '整段對照',
  ruby: '注音',
  rubyHint: '漢字上標拼音，假名上標振假名。',
  grammar: '語法著色',
  grammarHint: '主語、謂語、賓語等，按生成時的標註。',
  textSize: '字號',
  books: '本書',
  refreshLibrary: '重新整理書庫',
  theme: '主題',
  themePaper: '紙色',
  themeNight: '夜間',
  themeSystem: '跟隨系統',
  serif: '襯線字體',
  interfaceLanguage: '介面語言',
  storage: '儲存空間',
  storageUsed: '已用於本機',
  requestBook: '申請新書',
  requestHint: '僅限公共領域作品。將開啟 GitHub 議題，不會送到我們的伺服器。',
  requestPlaceholder: '想讀哪本書？',
  requestSend: '提交申請',
  about: '關於',
  aboutBody:
    '文庫讓你讀公共領域的經典，每個字上都有讀音，支援英文、中文與日文。書籍下載一次即可離線閱讀，你的一切操作都留在本機。',
  rights: '版權',
  rightsBody:
    '本應用收錄的作品均已進入公共領域。現代中文、日文與英文譯文由 LazyingArt LLC 根據公共領域原文生成並擁有。',
  loading: '載入中',
  offlineError: '無法連線書庫，已下載的書仍可閱讀。',
  retry: '重試',
  back: '返回',
  close: '關閉',
}

const ja: UICopy = {
  ...en,
  appName: '文庫',
  tagline: '三か国語の古典に、すべての文字へ読みを。',
  library: '書庫',
  shelf: '本棚',
  reading: '読書',
  settings: '設定',
  search: '検索',
  searchPlaceholder: '書名または著者',
  noResults: 'その名前の本は見つかりません。',
  allLanguages: 'すべて',
  chinese: '中国古典',
  japanese: '日本文学',
  world: '世界文学',
  onDevice: '端末にあり',
  chapters: '章',
  paragraphs: '段落',
  download: 'オフライン用にダウンロード',
  downloading: 'ダウンロード中',
  downloaded: '端末にあり',
  remove: '端末から削除',
  removeConfirm: 'ダウンロードした本文を削除しますか。本は書庫に残ります。',
  open: '開く',
  continueReading: '続きから',
  start: '読み始める',
  offlineReady: 'オフラインで読めます',
  chapterList: '目次',
  previous: '前の章',
  next: '次の章',
  finished: '本書は以上です。',
  show: '表示',
  layout: '並べ方',
  layoutSource: '原文のみ',
  layoutInterlinear: '対訳（行ごと）',
  layoutPaired: '対訳（段落ごと）',
  ruby: 'ふりがな',
  rubyHint: '漢字にはふりがな、中国語にはピンイン。',
  grammar: '文法で色分け',
  grammarHint: '主語・述語・目的語など、生成時の注記に従います。',
  textSize: '文字の大きさ',
  books: '冊',
  refreshLibrary: 'ライブラリを更新',
  theme: 'テーマ',
  themePaper: '紙',
  themeNight: '夜',
  themeSystem: '端末に合わせる',
  serif: '明朝体',
  interfaceLanguage: '表示言語',
  storage: '保存容量',
  storageUsed: 'を使用中',
  requestBook: '本をリクエスト',
  requestHint: 'パブリックドメインの作品のみ。GitHub の issue が開きます。',
  requestPlaceholder: 'どの本を読みたいですか',
  requestSend: 'リクエストを開く',
  about: 'このアプリについて',
  aboutBody:
    '文庫は、すべての文字に読みを添えてパブリックドメインの古典を読むアプリです。英語・中国語・日本語に対応し、一度ダウンロードすればオフラインで読めます。操作は端末の外に出ません。',
  rights: '権利',
  rightsBody:
    '収録作品はすべて著作権保護期間が終了しています。現代語訳は LazyingArt LLC がパブリックドメインの原文から生成し、保有しています。',
  loading: '読み込み中',
  offlineError: '書庫に接続できません。ダウンロード済みの本は読めます。',
  retry: '再試行',
  back: '戻る',
  close: '閉じる',
}

export const copies: Record<UILanguage, UICopy> = { en, 'zh-Hans': zhHans, 'zh-Hant': zhHant, ja }

export const uiLanguageNames: Record<UILanguage, string> = {
  en: 'English',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
  ja: '日本語',
}

/** The label for a book language, in the reader's own interface language. */
export function languageName(lang: string, ui: UILanguage): string {
  const table: Record<string, Record<UILanguage, string>> = {
    en: { en: 'English', 'zh-Hans': '英文', 'zh-Hant': '英文', ja: '英語' },
    zh: { en: 'Chinese', 'zh-Hans': '中文', 'zh-Hant': '中文', ja: '中国語' },
    ja: { en: 'Japanese', 'zh-Hans': '日文', 'zh-Hant': '日文', ja: '日本語' },
    wenyan: { en: 'Classical Chinese', 'zh-Hans': '文言文', 'zh-Hant': '文言文', ja: '漢文' },
    zh_modern: { en: 'Modern Chinese', 'zh-Hans': '现代中文', 'zh-Hant': '現代中文', ja: '現代中国語' },
    ja_modern: { en: 'Modern Japanese', 'zh-Hans': '现代日文', 'zh-Hant': '現代日文', ja: '現代日本語' },
  }
  return table[lang]?.[ui] ?? lang
}
