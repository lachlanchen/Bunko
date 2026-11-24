import { Zip, ZipDeflate, ZipPassThrough, strToU8 } from 'fflate'
import katex from 'katex'
import type { BookMeta, Chapter, Layout, Line, Paragraph, Unit } from '../types'
import { loadBookImage } from './bookAssets'
import { htmlLanguage, languageDirection, unitLine } from './languages'
import { loadBookSentences, loadChapter } from './library'
import { canSplitSentences, sentenceChapterHash, sentenceLines, type ChapterSentenceMap } from './sentences'
import { plainText, tokenParts } from './text'
import { EPUB_TYPE, EPUB_MAX_BYTES, epubLanguages } from './epubOptions'

const xml = '<?xml version="1.0" encoding="UTF-8"?>'
// eslint-disable-next-line no-control-regex -- Match the XML 1.0 character range.
const escape = (text: string) => text.replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu, '\ufffd')
  .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!)
const language = (tag: string) => `lang="${escape(htmlLanguage(tag))}" xml:lang="${escape(htmlLanguage(tag))}" dir="${languageDirection(tag)==='rtl'?'rtl':'ltr'}"`

function renderLine(line: Line, ruby: boolean) {
  return line.map(token => {
    const { text, reading } = tokenParts(token)
    const base = escape(text)
    return ruby && reading ? `<ruby>${base}<rp>(</rp><rt>${escape(reading)}</rt><rp>)</rp></ruby>` : base
  }).join('')
}

function renderUnit(unit: Unit, lang: string, ruby: boolean, split: boolean, cuts?: number[]) {
  const line = unitLine(unit, lang)
  if (!line?.length) return ''
  const rich = unit.rich?.[lang]
  if (rich?.length && rich.some(item => item.math)) {
    return rich.map(item => {
      if (!item.math) return escape(item.text ?? '')
      try {
        const math = katex.renderToString(item.math, { output: 'mathml', displayMode: !!item.display,
          trust: false, strict: 'ignore', maxExpand: 300, maxSize: 20 })
        // KaTeX writes some upright named operators as a group within a token.
        // MathML token elements require text, so preserve the same operator glyphs.
        return math.replace(/(<mo(?: [^>]+)?>)<mrow>((?:<mi mathvariant="normal">[^<>]+<\/mi>)+)<\/mrow>(<\/mo>)/g,
          (_, open, glyphs, close) => open + glyphs.replace(/<\/?mi[^>]*>/g, '') + close)
      }
      catch { return `<code>${escape(item.math)}</code>` }
    }).join('')
  }
  const lines = split && !unit.annotation && !unit.rich ? sentenceLines(line, lang, cuts) : [line]
  return lines.map(item => renderLine(item, ruby)).join('<br />')
}

const xhtml = (title: string, lang: string, body: string) =>
  `${xml}<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" ${language(lang)}><head><title>${escape(title)}</title><link rel="stylesheet" type="text/css" href="reader.css" /></head><body>${body}</body></html>`
const css = 'body{line-height:1.5} h1,h2{line-height:1.2} p{margin:.28em 0;text-indent:0} .passage{margin:1.05em 0} .unit{margin:.5em 0} .translation{font-size:.91em} rt{font-size:.59em} figure{margin:1em 0;text-align:center} img{max-width:100%;height:auto} figcaption{font-size:.88em} nav li{margin:.45em 0}'

type Edition = { langs: string[]; layout: Layout; ruby: boolean }
type Reads = {
  chapter: typeof loadChapter
  sentences: typeof loadBookSentences
  image: (path: string, signal?: AbortSignal) => Promise<Response>
}
const defaults: Reads = { chapter: loadChapter, sentences: loadBookSentences, image: loadBookImage }

export async function createEpub(book: BookMeta, edition: Edition, {
  signal, onProgress, reads = defaults,
}: { signal?: AbortSignal; onProgress?: (done: number, total: number) => void; reads?: Reads } = {}) {
  const check = () => { if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError') }
  const langs = epubLanguages(book, edition)
  const [primary] = langs
  const title = book.titleText[primary] || book.titleText[book.primary] || book.id
  const modified = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
  const chunks: ArrayBuffer[] = []
  let zipFailure: unknown
  let packedBytes = 0
  let rawBytes = 0
  const zip = new Zip((err, data) => {
    if (err) { zipFailure = err; return }
    packedBytes += data.length
    if (packedBytes > EPUB_MAX_BYTES) { zipFailure = new Error('epub_too_large'); return }
    const part = new Uint8Array(data.length)
    part.set(data)
    chunks.push(part.buffer)
  })
  const add = (name: string, body: string | Uint8Array, store = false) => {
    check()
    const bytes = typeof body === 'string' ? strToU8(body) : body
    rawBytes += bytes.length
    if (rawBytes > 160 * 1024 * 1024) throw new Error('epub_too_large')
    const item = store ? new ZipPassThrough(name) : new ZipDeflate(name, { level: 4 })
    zip.add(item)
    item.push(bytes, true)
    if (zipFailure) throw zipFailure
  }
  add('mimetype', EPUB_TYPE, true)
  add('META-INF/container.xml', `${xml}<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="EPUB/content.opf" media-type="application/oebps-package+xml" /></rootfiles></container>`)
  add('EPUB/reader.css', css)
  const manifest: string[] = [
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />',
    '<item id="css" href="reader.css" media-type="text/css" />',
  ]
  const spine: string[] = []
  const nav: string[] = []
  const images = new Map<string, string>()
  async function figureImage(path: string, caption: string) {
    if (!/^assets\/[a-zA-Z0-9/_-]+\.(?:png|jpe?g|webp)$/.test(path)) throw new Error('epub_invalid_figure')
    let href = images.get(path)
    if (!href) {
      const ext = path.endsWith('.png') ? 'png' : path.endsWith('.webp') ? 'webp' : 'jpeg'
      const id = `image-${images.size + 1}`
      href = `${id}.${ext}`
      const image = new Uint8Array(await (await reads.image(`books/${book.id}/${path}`, signal)).arrayBuffer())
      add(`EPUB/${href}`, image, true)
      manifest.push(`<item id="${id}" href="${href}" media-type="image/${ext}" />`)
      images.set(path, href)
    }
    return `<img src="${href}" alt="${escape(caption)}" />`
  }
  async function renderParagraph(paragraph: Paragraph, position: number, map?: ChapterSentenceMap) {
    const paired = edition.layout === 'paired'
    const render = (lang: string, body: string) => body
      ? `<p class="${lang === primary ? 'main' : 'translation'}" ${language(lang)}>${body}</p>` : ''
    const units = paired
      ? langs.map(lang => render(lang, paragraph.u.map(unit => renderUnit(unit, lang, edition.ruby, false)).filter(Boolean).join(' '))).join('')
      : paragraph.u.map((unit, i) => {
        const lines = langs.map(lang => render(lang, renderUnit(unit, lang, edition.ruby,
          edition.layout === 'interlinear' && canSplitSentences(paragraph), map?.[`${position}.${i}`]?.[lang]))).join('')
        return lines ? `<div class="unit">${lines}</div>` : ''
      }).join('')
    let figure = ''
    if (paragraph.figure) {
      const captions = paragraph.figure.caption
      const alt = captions?.[primary] || captions?.[book.primary] || ''
      const img = await figureImage(paragraph.figure.path, alt)
      const text = langs.flatMap(lang => captions?.[lang] ? [`<p ${language(lang)}>${escape(captions[lang]!)}</p>`] : []).join('')
      figure = `<figure>${img}${text ? `<figcaption>${text}</figcaption>` : ''}</figure>`
    }
    return figure || units ? `<div class="passage">${figure}${units}</div>` : ''
  }

  if (!book.chapters.length) throw new Error('epub_empty')
  const cuts = edition.layout === 'interlinear' ? await reads.sentences(book.id, signal) : null
  onProgress?.(0, book.chapters.length)
  for (const [position, row] of book.chapters.entries()) {
    check()
    const chapter: Chapter = await reads.chapter(book.id, row.file, signal)
    if (chapter.n !== row.n) throw new Error('epub_edition_changed')
    const sidecar = cuts?.[row.file]
    const map = sidecar?.chapterHash === sentenceChapterHash(chapter) ? sidecar.units : undefined
    const headingTag = chapter.title?.[primary] ? primary : book.primary
    const heading = chapter.title?.[headingTag]
    const label = plainText(heading) || row.title[primary] || row.title[book.primary] || String(row.n)
    const id = `chapter-${position + 1}`
    const href = `${id}.xhtml`
    const paragraphs = []
    for (const [index, paragraph] of chapter.p.entries()) paragraphs.push(await renderParagraph(paragraph, index, map))
    const main = `<h1 ${language(headingTag)}>${heading?.length ? renderLine(heading, edition.ruby) : escape(label)}</h1>${paragraphs.join('')}`
    add(`EPUB/${href}`, xhtml(label, primary, main))
    manifest.push(`<item id="${id}" href="${href}" media-type="application/xhtml+xml"${main.includes('<math ') ? ' properties="mathml"' : ''} />`)
    spine.push(`<itemref idref="${id}" />`)
    nav.push(`<li><a href="${href}" ${language(headingTag)}>${escape(label)}</a></li>`)
    onProgress?.(position + 1, book.chapters.length)
    if (position % 4 === 0) await new Promise(resolve => setTimeout(resolve, 0))
  }
  add('EPUB/nav.xhtml', xhtml(title, primary, `<nav epub:type="toc" id="toc"><h1>${escape(title)}</h1><ol>${nav.join('')}</ol></nav>`))
  const creator = book.author?.name ? `<dc:creator>${escape(book.author.name)}</dc:creator>` : ''
  const tags = [...new Set(langs.map(htmlLanguage))].map(tag => `<dc:language>${escape(tag)}</dc:language>`).join('')
  add('EPUB/content.opf', `${xml}<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">urn:bunko:book:${escape(book.id)}:${escape(langs.join(','))}</dc:identifier><dc:title>${escape(title)}</dc:title>${creator}${tags}<meta property="dcterms:modified">${modified}</meta></metadata><manifest>${manifest.join('')}</manifest><spine>${spine.join('')}</spine></package>`)
  zip.end()
  if (zipFailure) throw zipFailure
  check()
  const name = title.replace(/[^\p{L}\p{N}\p{M} _().-]+/gu, ' ').replace(/\s+/g, ' ').trim().replace(/^\.+|[. ]+$/g, '')
  const filename = `${Array.from(name || book.id).slice(0, 96).join('')}.epub`
  return new File(chunks, filename, { type: EPUB_TYPE })
}
