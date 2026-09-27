import { useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import bundleUrl from '../../.generated/document-math.js?url'
import type { PrivateDocument } from '../lib/documentAgent'
let loading: Promise<void> | undefined
function renderer() {
  return loading ||= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script'); script.src = bundleUrl; script.async = true
    script.onload = () => resolve()
    script.onerror = () => { loading = undefined; script.remove(); reject(new Error('renderer')) }
    document.head.append(script)
  })
}
export function DocumentContent({ document, text, preparing, failed }: { document?: PrivateDocument; text?: string; preparing: string; failed: string }) {
  const container = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  const mmd = document?.mmd ?? text ?? ''
  useEffect(() => {
    let active = true
    const urls: string[] = []
    void renderer().then(() => {
      if (!active || !container.current) return
      const render = (window as Window & { markdownToHTML?: (text: string, options: Record<string, unknown>) => string }).markdownToHTML
      if (!render) throw new Error('renderer')
      const html = render(mmd, { htmlTags: false, width: Math.max(280, container.current.clientWidth), linkify: false, typographer: false, accessibility: { assistiveMml: true }, outMath: { include_svg: true } })
      const template = globalThis.document.createElement('template')
      template.innerHTML = DOMPurify.sanitize(html, { USE_PROFILES: { html: true, svg: true, mathMl: true }, ADD_TAGS: ['mjx-container', 'mjx-assistive-mml'], ADD_ATTR: ['jax', 'focusable', 'viewBox'], FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'button'], FORBID_ATTR: ['srcdoc', 'srcset'] })
      for (const img of template.content.querySelectorAll('img')) {
        const path = img.getAttribute('src')?.replace(/^\.\//, '')
        const asset = document?.assets?.find(a => a.path === path)
        if (!asset || !/\.(png|jpe?g|webp|gif)$/i.test(asset.path)) { img.replaceWith(globalThis.document.createTextNode(`[${img.alt || 'Figure unavailable'}]`)); continue }
        const ext = asset.path.split('.').pop()?.toLowerCase()
        const bytes = Uint8Array.from(atob(asset.data), ch => ch.charCodeAt(0))
        const url = URL.createObjectURL(new Blob([bytes], { type: `image/${ext === 'jpg' ? 'jpeg' : ext}` }))
        urls.push(url); img.src = url; img.loading = 'lazy'; img.decoding = 'async'
        // Word dimensions may be inches; the mobile renderer sizes figures from their pixels.
        img.removeAttribute('width'); img.removeAttribute('height'); img.removeAttribute('style')
      }
      template.content.querySelectorAll('[style]').forEach(e => { if (/url\s*\(|expression\s*\(|@import/i.test(e.getAttribute('style') || '')) e.removeAttribute('style') })
      template.content.querySelectorAll('svg [href],svg [xlink\\:href]').forEach(e => {
        for (const name of ['href', 'xlink:href']) if (e.hasAttribute(name) && !e.getAttribute(name)?.startsWith('#')) e.removeAttribute(name)
      })
      template.content.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href') || ''
        if (!href.startsWith('#') && !/^https?:\/\//i.test(href)) link.removeAttribute('href')
        link.rel = 'noopener noreferrer'; if (!href.startsWith('#')) link.target = '_blank'
      })
      container.current.replaceChildren(template.content)
    }).catch(() => { if (active) setError(true) })
    return () => { active = false; urls.forEach(url => URL.revokeObjectURL(url)) }
  }, [mmd, document])
  return error ? <><p role="alert">{failed}</p><pre className="document-source">{mmd}</pre></> : <div ref={container} className="document-prose"><p>{preparing}</p></div>
}
