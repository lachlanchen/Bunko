// Public preview. Values come from Bunko's public catalogue.
import { localizedTitle } from './title-locale.mjs'

const origin = 'https://bunko.lazying.art'
const reader = 'https://lachlan.lazying.art/Bunko/'
const languageCopy = {
  en: ['en_US', 'Read in browser', 'Open Bunko', 'Read with interlaced languages and ruby readings.'],
  'zh-Hans': ['zh_CN', '在浏览器阅读', '打开文库', '交错阅读多种语言，查看假名和注音。'],
  'zh-Hant': ['zh_TW', '在瀏覽器閱讀', '開啟文庫', '交錯閱讀多種語言，查看假名和注音。'],
  ja: ['ja_JP', 'ブラウザで読む', '文庫を開く', '対訳とふりがなで読む。'],
}

export const sharedBookPath = /^\/bunko\/share\/book\/([a-z0-9-]{1,120})(?:\/(en|zh-Hans|zh-Hant|ja))?$/
export const sharePagePolicy = "default-src 'none'; style-src 'unsafe-inline'; img-src https://bunko.lazying.art https://lachlan.lazying.art; base-uri 'none'; frame-ancestors 'none'"

export function publicBookCard(book, locale) {
  const { id } = book
  const ui = Object.hasOwn(languageCopy, locale) ? locale : 'en'
  const [, , , fallback] = languageCopy[ui]
  const { lang, text } = localizedTitle(book.title, ui, book.primary, id)
  const cover = typeof book.cover === 'string' && new RegExp('^books/' + id + '/cover-[a-f0-9]+\\.(?:webp|png|jpg)$').test(book.cover)
  return {
    ui, title: text, language: lang, description: book.author || fallback,
    url: origin + '/bunko/share/book/' + id + (locale ? '/' + ui : ''),
    web: reader + '?book=' + id,
    native: 'art.lazying.bunko://book/' + id,
    image: cover ? origin + '/bunko/books-cache/' + book.cover : reader + 'icon-512.png',
  }
}

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))

export function sharePage(card) {
  const e = escapeHTML
  const [ogLocale, read, open] = languageCopy[card.ui]
  const title = e(card.title), image = e(card.image), link = e(card.url)
  return `<!doctype html>
<html lang="${card.ui}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · Bunko</title>
<meta name="description" content="${e(card.description)}">
<link rel="canonical" href="${link}">
<meta property="og:type" content="book">
<meta property="og:locale" content="${ogLocale}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${e(card.description)}">
<meta property="og:url" content="${link}">
<meta property="og:image" content="${image}">
<meta property="og:image:alt" content="${title}">
<meta property="og:site_name" content="Bunko">
<meta name="twitter:card" content="summary">
<meta name="apple-itunes-app" content="app-id=6815137919">
<style>
html{color-scheme:light dark}body{font:17px/1.6 system-ui,sans-serif;margin:0;background:#f7f9fc;color:#172339}
main{max-width:640px;margin:6vh auto;padding:clamp(14px,4vw,28px)}article{padding:clamp(18px,5vw,30px);border:1px solid #8798ac40;border-radius:26px;background:white}
.heading{display:flex;align-items:center;gap:clamp(14px,4vw,26px)}.heading div{min-width:0}
img{width:clamp(76px,24vw,136px);aspect-ratio:2/3;object-fit:contain;border-radius:12px;background:#f1f4f9}
h1{font-family:ui-serif,Georgia,serif;font-size:clamp(24px,5vw,34px);line-height:1.25;margin:.25em 0;overflow-wrap:anywhere}small{color:#52657b}
nav{display:flex;flex-wrap:wrap;gap:10px;padding-top:22px}a{color:inherit;text-decoration:none;border:1px solid #8798ac60;border-radius:13px;padding:9px 14px;min-height:24px}
.primary{background:#246b9a;color:white;border-color:transparent}.stores{font-size:14px;padding-top:12px}p{overflow-wrap:anywhere}
@media(prefers-color-scheme:dark){body{background:#141923;color:#e6edf6}article{background:#1e2634}small{color:#b4c4d9}img{background:#253143}}
</style>
</head>
<body><main><article>
<div class="heading"><img src="${image}" alt=""><div><small>Bunko · 文庫</small><h1 lang="${e(card.language)}" dir="auto">${title}</h1><p dir="auto">${e(card.description)}</p></div></div>
<nav><a class="primary" href="${e(card.web)}">${read}</a><a href="${e(card.native)}">${open}</a></nav>
<nav class="stores"><a href="https://apps.apple.com/app/id6815137919">App Store</a><a href="https://play.google.com/store/apps/details?id=art.lazying.bunko">Google Play</a></nav>
</article></main></body></html>`
}
