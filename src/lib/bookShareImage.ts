import QRCode from 'qrcode'
import { loadBookImage } from './bookAssets'
import { languageDirection } from './languages'
import { validBookPath } from './bookTransport'

export type BookShareImage = { title: string; titleLanguage?: string; author?: string; cover?: string; url: string }

const width = 1080
const height = 1350

function linesFor(ctx: CanvasRenderingContext2D, text: string, limit: number, lang: string) {
  const parts = typeof Intl.Segmenter === 'function'
    ? Array.from(new Intl.Segmenter(lang, { granularity: 'word' }).segment(text), part => part.segment)
    : text.match(/\s+|[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]|[^\s\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+/gu) ?? []
  return parts.flatMap(part => ctx.measureText(part).width <= limit ? [part] : Array.from(part))
    .reduce<string[]>((lines, part) => {
      const last = lines.length - 1
      const current = lines[last] ?? ''
      if (ctx.measureText(current + part).width <= limit) lines[last] = current + part
      else lines.push(part.trimStart())
      return lines
    }, ['']).map(line => line.trim()).filter(Boolean)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x+radius,y)
  ctx.arcTo(x+w,y,x+w,y+h,radius)
  ctx.arcTo(x+w,y+h,x,y+h,radius)
  ctx.arcTo(x,y+h,x,y,radius)
  ctx.arcTo(x,y,x+w,y,radius)
  ctx.closePath()
}

async function coverImage(path?: string) {
  if (!path || !validBookPath(path) || !/^books\/[a-z0-9-]+\/cover-/.test(path)) return null
  try {
    const blob = await (await loadBookImage(path)).blob()
    const url = URL.createObjectURL(blob)
    try {
      const image = new Image()
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('Could not decode the cover'))
        image.src = url
      })
      return image
    } finally { URL.revokeObjectURL(url) }
  } catch { return null }
}

/** A self-contained portrait image for image-first share targets. */
export async function createBookShareImage(book: BookShareImage, image?: HTMLImageElement | null) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create a card')
  const background = ctx.createLinearGradient(0, 0, width, height)
  background.addColorStop(0, '#121a36')
  background.addColorStop(.59, '#213b52')
  background.addColorStop(1, '#16575b')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)
  const glow = ctx.createRadialGradient(850, 50, 20, 850, 50, 1000)
  glow.addColorStop(0, '#6989bb66')
  glow.addColorStop(1, '#6989bb00')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = '#f3d79950'
  ctx.lineWidth = 2
  roundRect(ctx, 44, 44, width-88, height-88, 40)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.fillStyle = '#f3d799'
  ctx.font = '600 33px sans-serif'
  ctx.fillText('BUNKO  文庫', width/2, 119)

  const art = image === undefined ? await coverImage(book.cover) : image
  const cover = { x: 326, y: 166, w: 428, h: 602, radius: 18 }
  ctx.save()
  ctx.shadowBlur = 46
  ctx.shadowOffsetY = 17
  ctx.shadowColor = '#0008'
  roundRect(ctx, cover.x, cover.y, cover.w, cover.h, cover.radius)
  ctx.fillStyle = '#24405c'
  ctx.fill()
  ctx.restore()
  ctx.save()
  roundRect(ctx, cover.x, cover.y, cover.w, cover.h, cover.radius)
  ctx.clip()
  if (art?.naturalWidth && art.naturalHeight) {
    const scale = Math.min(cover.w / art.naturalWidth, cover.h / art.naturalHeight)
    const w = art.naturalWidth * scale, h = art.naturalHeight * scale
    ctx.drawImage(art, cover.x + (cover.w-w)/2, cover.y + (cover.h-h)/2, w, h)
  } else {
    ctx.strokeStyle = '#f3d79990'
    roundRect(ctx, cover.x + 30, cover.y + 30, cover.w - 60, cover.h - 60, 7)
    ctx.stroke()
    ctx.fillStyle = '#f3d799'
    ctx.font = '600 140px serif'
    ctx.fillText('文', width/2, 506)
  }
  ctx.restore()

  const locale = book.titleLanguage ?? 'en'
  ctx.direction = languageDirection(locale) === 'rtl' ? 'rtl' : 'ltr'
  let size = 76
  let lines: string[] = []
  for (; size >= 43; size -= 4) {
    ctx.font = `600 ${size}px "Noto Serif", Georgia, serif`
    lines = linesFor(ctx, book.title, 864, locale)
    if (lines.length <= 3 && lines.length * size * 1.16 <= 190) break
  }
  if (lines.length > 3) lines = [...lines.slice(0, 2), lines[2].trimEnd() + '…']
  ctx.fillStyle = '#fffaf0'
  lines.forEach((line, i) => ctx.fillText(line, width/2, 875 + size * 1.16 * i, 864))
  if (book.author) {
    ctx.direction = 'inherit'
    ctx.fillStyle = '#dbe7ee'
    ctx.font = '400 32px sans-serif'
    ctx.fillText(book.author, width/2, 875 + size * 1.16 * (lines.length-1) + 63, 838)
  }

  const { modules } = QRCode.create(book.url, { errorCorrectionLevel: 'M' })
  const pixels = Math.max(1, Math.floor(142 / (modules.size + 8)))
  const qrSize = (modules.size + 8) * pixels
  const qx = 942-qrSize, qy=1185
  ctx.fillStyle = '#fffaf0'
  ctx.fillRect(qx, qy, qrSize, qrSize)
  ctx.fillStyle = '#142637'
  for (let row=0; row<modules.size; row++) {
    for (let col=0; col<modules.size; col++) {
      if (modules.get(row, col)) ctx.fillRect(qx+(col+4)*pixels, qy+(row+4)*pixels, pixels, pixels)
    }
  }
  ctx.direction = 'ltr'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#f3d799'
  ctx.font = '500 29px sans-serif'
  ctx.fillText('bunko.lazying.art', 112, 1243)
  const png = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not save the card')), 'image/png'))
  const slug = new URL(book.url).pathname.split('/')[4] || 'book'
  return new File([png], `bunko-${slug}.png`, { type: 'image/png' })
}
