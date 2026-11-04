// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { useBookImage } from './useBookImage'
const fetchImage = vi.hoisted(() => vi.fn(async () => new Response(new Blob(['image']))))
vi.mock('./bookAssets', () => ({ loadBookImage: fetchImage }))
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); fetchImage.mockClear() })
function Figure() { const { element, src } = useBookImage('books/example/assets/figure.webp'); return <div ref={element}>{src && <img src={src} />}</div> }
it('loads a scrolled-near figure even when native WebKit defers its observer callback', async () => {
  let top = 5000
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ top, bottom: top + 48 } as DOMRect))
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:figure'), revokeObjectURL: vi.fn() })
  const { container, unmount } = render(<Figure />)
  expect(fetchImage).not.toHaveBeenCalled()
  top = 200
  act(() => { document.dispatchEvent(new Event('scroll')) })
  await waitFor(() => expect(container.querySelector('img')?.getAttribute('src')).toBe('blob:figure'))
  act(() => { document.dispatchEvent(new Event('scroll')) })
  expect(fetchImage).toHaveBeenCalledTimes(1)
  unmount()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:figure')
})
it('loads an initially visible figure and removes its fallback on unmount', async () => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 20, bottom: 68 } as DOMRect)
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:visible'), revokeObjectURL: vi.fn() })
  const { container, unmount } = render(<Figure />)
  await waitFor(() => expect(container.querySelector('img')).not.toBeNull())
  unmount()
  act(() => { document.dispatchEvent(new Event('scroll')) })
  expect(fetchImage).toHaveBeenCalledTimes(1)
})
