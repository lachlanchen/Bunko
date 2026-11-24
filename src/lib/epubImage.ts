// EPUB readers and Kindle converters share reliable support for opaque PNG and JPEG.
export async function epubFigure(response: Response, path: string) {
  const source = await response.blob()
  if (!path.endsWith('.webp')) {
    return { type: path.endsWith('.png') ? 'png' : 'jpeg', bytes: new Uint8Array(await source.arrayBuffer()) }
  }

  const url = URL.createObjectURL(new Blob([source], { type: 'image/webp' }))
  const image = new Image()
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('epub_invalid_figure'))
      image.src = url
    })
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('epub_invalid_figure')
    // Bound the working raster, without enlarging small images or cropping text.
    const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    try {
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) throw new Error('epub_invalid_figure')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      const encode = (type: 'png' | 'jpeg', quality?: number) => new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('epub_invalid_figure')), 'image/' + type, quality)
      })
      const png = await encode('png')
      // Favor lossless figures. Compress large rasters to keep exports portable.
      if (png.size <= Math.min(65_536, Math.max(24_576, source.size * 3))) {
        return { type: 'png', bytes: new Uint8Array(await png.arrayBuffer()) }
      }
      let jpeg = await encode('jpeg', .88)
      for (const quality of [.78, .70]) {
        if (jpeg.size <= 98_304) break
        jpeg = await encode('jpeg', quality)
      }
      return { type: 'jpeg', bytes: new Uint8Array(await jpeg.arrayBuffer()) }
    } finally { canvas.width = canvas.height = 0 }
  } finally { URL.revokeObjectURL(url) }
}
