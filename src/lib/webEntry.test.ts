// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const html = readFileSync('index.html', 'utf8')
const canonical = 'https://lachlan.lazying.art/Bunko/'
const apple = 'https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919'

describe('public web entry before JavaScript', () => {
  it('has one stable canonical and descriptive sharing metadata', () => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    expect(doc.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(canonical)
    expect(doc.title).toMatch(/Bunko.*Chinese, Japanese.*English Classics/)
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('offline')
    expect(doc.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(canonical)
    for (const key of ['og:title', 'og:description', 'og:image', 'og:image:alt']) {
      expect(doc.querySelectorAll(`meta[property="${key}"]`)).toHaveLength(1)
      expect(doc.querySelector(`meta[property="${key}"]`)?.getAttribute('content')).toBeTruthy()
    }
    expect(doc.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe('summary')
  })

  it('offers a meaningful entry and a verified store route without scripts', () => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const entry = doc.querySelector('#root main')!
    expect(entry.querySelector('h1')?.textContent).toBe('Bunko')
    expect(entry.textContent).toContain('where the edition includes them')
    expect(entry.textContent).toContain('offline reading')
    expect(entry.querySelector('noscript')?.textContent).toContain('Enable it')
    expect(entry.querySelector(`a[href="${apple}"]`)).not.toBeNull()
    expect(entry.querySelector('a[href*="play.google.com"]')).toBeNull()
  })

  it('keeps local entry assets and support inside the project base path', () => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    expect(new URL(doc.querySelector('#bunko-entry img')!.getAttribute('src')!, canonical).href).toBe(canonical + 'icon-192.png')
    expect(new URL(doc.querySelector('#bunko-entry footer a')!.getAttribute('href')!, canonical).href).toBe(canonical + 'support.html')
    expect(doc.querySelector('script[type="module"]')?.getAttribute('src')).toBe('/src/main.tsx')
  })
})
