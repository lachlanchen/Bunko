// Package the imagegen master without redrawing its artwork.
import sharp from 'sharp'
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const registry = JSON.parse(await readFile(resolve(root, 'assets/brand/icon-variants.json'), 'utf8'))
const variantId = process.argv[2] ?? registry.active
const variant = registry.variants[variantId]
if (!variant) throw new Error(`Unknown icon variant: ${variantId}`)
const source = resolve(root, variant.source)
// Legacy macOS and web launchers do not supply an icon mask. Keep that shape
// in the export, leaving the approved master and system-masked assets opaque.
async function rounded(size, inset = 0, circle = false) {
  const tile = size - inset * 2
  const mask = Buffer.from(`<svg width="${tile}" height="${tile}"><rect width="${tile}" height="${tile}" rx="${circle ? tile / 2 : tile * .225}" fill="white"/></svg>`)
  const artwork = await sharp(source).resize(tile, tile).ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background: '#00000000' } })
    .composite([{ input: artwork, left: inset, top: inset }])
}
const outputs = [
  ['assets/icon.png', 1024], ['assets/icon-foreground.png', 1024],
  ['public/icon-192.png', 192], ['public/icon-512.png', 512],
  ['public/favicon.png', 48], ['store/assets/play-icon.png', 512],
  ['public/icon-maskable-512.png', 512],
  ['ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024],
  ['watch/BunkoWatch/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png', 1024],
]
const catalog = 'macos/Bunko/Assets.xcassets/AppIcon.appiconset'
const { images } = JSON.parse(await readFile(resolve(root, catalog, 'Contents.json'), 'utf8'))
for (const image of images) outputs.push([`${catalog}/${image.filename}`, parseInt(image.size) * parseInt(image.scale)])
for (const [path, size] of outputs) {
  const target = resolve(root, path)
  await mkdir(dirname(target), { recursive: true })
  const mac = path.startsWith(`${catalog}/`)
  const web = /^public\/(icon-(192|512)\.png|favicon\.png)$/.test(path)
  const pipeline = mac || web
    ? await rounded(size, mac ? Math.round(size * .09) : 0)
    : sharp(source).resize(size, size).removeAlpha()
  await pipeline.png().toFile(target)
}
for (const size of [48, 72, 96, 128, 192, 256, 512]) {
  await (await rounded(size)).webp({ quality: 90 }).toFile(resolve(root, `icons/icon-${size}.webp`))
}
// Keep the historical SVG URL working with the same artwork, independent of fonts.
const icon = await readFile(resolve(root, 'public/icon-512.png'))
await writeFile(resolve(root, 'public/icon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Bunko"><image width="512" height="512" href="data:image/png;base64,${icon.toString('base64')}"/></svg>\n`)
console.log(`Exported ${outputs.length + 8} Bunko icon assets.`)

// Native packaging uses the same raster artwork, with room for Android masks.
const require = createRequire(import.meta.url)
const templates = require('@capacitor/assets/dist/platforms/android/assets.js')
const res = resolve(root, 'android/app/src/main/res')
for (const item of Object.values(templates)) {
  if (item.kind === 'icon') {
    const dir = resolve(res, `mipmap-${item.density}`)
    await mkdir(dir, { recursive: true })
    for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
      await (await rounded(item.width, 0, name === 'ic_launcher_round.png')).png().toFile(resolve(dir, name))
    }
  } else if (item.kind === 'adaptive-icon') {
    const dir = resolve(res, `mipmap-${item.density}`)
    const size = item.width, markSize = Math.round(size * 72 / 108)
    const mark = await (await rounded(markSize)).png().toBuffer()
    await sharp({ create: { width: size, height: size, channels: 4, background: variant.background } })
      .png().toFile(resolve(dir, 'ic_launcher_background.png'))
    await sharp({ create: { width: size, height: size, channels: 4, background: variant.background } })
      .composite([{ input: mark, gravity: 'center' }]).png().toFile(resolve(dir, 'ic_launcher_foreground.png'))
  } else if (item.kind === 'splash' || item.kind === 'splash-dark') {
    const dir = resolve(res, item.density ? `drawable-${item.density}` : 'drawable')
    await mkdir(dir, { recursive: true })
    const mark = await sharp(source).resize(Math.round(Math.min(item.width, item.height) * .3)).toBuffer()
    await sharp({ create: { width: item.width, height: item.height, channels: 3, background: variant.splash } })
      .composite([{ input: mark, gravity: 'center' }]).png().toFile(resolve(dir, 'splash.png'))
  }
}
const splashMark = await sharp(source).resize(820, 820).toBuffer()
await sharp({ create: { width: 2732, height: 2732, channels: 3, background: variant.splash } })
  .composite([{ input: splashMark, gravity: 'center' }]).png().toFile(resolve(root, 'assets/splash.png'))
const iosSplash = resolve(root, 'ios/App/App/Assets.xcassets/Splash.imageset')
const splashImages = JSON.parse(await readFile(resolve(iosSplash, 'Contents.json'), 'utf8')).images
for (const item of splashImages) if (item.filename) await copyFile(resolve(root, 'assets/splash.png'), resolve(iosSplash, item.filename))
