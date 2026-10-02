import { useEffect, useRef, useState } from 'react'
import { loadBookImage } from './bookAssets'

/** Fetch only near the viewport, once, through the same cache and fallback path. */
export function useBookImage(path: string) {
  const element = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState({ path: '', src: '' })
  useEffect(() => {
    if (!path) return
    let cancelled = false, started = false, objectUrl = ''
    const load = () => {
      if (started || cancelled) return
      started = true
      void loadBookImage(path).then(response => response.blob()).then(blob => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setImage({ path, src: objectUrl })
      }).catch(() => { /* Keep the local placeholder; retry after reconnect. */ })
    }
    const retry = () => { if (!objectUrl) { started = false; load() } }
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer?.disconnect(); load() }
    }, { rootMargin: '400px' })
    if (observer && element.current) observer.observe(element.current)
    else load()
    window.addEventListener('online', retry)
    return () => { cancelled = true; observer?.disconnect(); window.removeEventListener('online', retry); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [path])
  return { element, src: image.path === path ? image.src : '' }
}
