// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TranslationRequest } from './TranslationRequest'
import type { BookMeta } from '../types'
afterEach(cleanup)
it('requires a title and arbitrary target language before enabling a public request', () => {
  const {container}=render(<TranslationRequest ui="en" />)
  fireEvent.click(screen.getByText('Request a translation'))
  const request=container.querySelector('.translation-links .button')!
  expect(request.hasAttribute('href')).toBe(false)
  fireEvent.change(screen.getByLabelText('Book title'), {target:{value:'The Tale of Genji'}})
  fireEvent.change(screen.getByLabelText('Target language'), {target:{value:'other'}})
  expect(request.hasAttribute('href')).toBe(false)
  fireEvent.change(screen.getByLabelText('Another language'), {target:{value:'עברית (he)'}})
  const url=new URL(request.getAttribute('href')!)
  expect(url.searchParams.get('body')).toContain('Requested language: עברית (he)')
  expect(request.getAttribute('rel')).toContain('noopener')
})

it('uses the current book directly without requiring its title again', () => {
  const book: BookMeta = { schema: 1, id: 'sanshiro', mode: 'trilingual_standard', primary: 'ja', langs: ['ja', 'en', 'zh'], title: {}, titleText: { ja: '三四郎' }, author: { name: 'Natsume Sōseki' }, chapters: [], bytes: 0, paras: 0 }
  const { container } = render(<TranslationRequest ui="en" book={book} expanded />)
  expect(screen.queryByLabelText('Book title')).toBeNull()
  expect(container.querySelector('details')?.open).toBe(true)
  fireEvent.change(screen.getByLabelText('Target language'), { target: { value: 'fr' } })
  const url = new URL(screen.getByRole('link', { name: /Open translation request/ }).getAttribute('href')!)
  expect(url.searchParams.get('title')).toContain('三四郎')
  expect(url.searchParams.get('body')).toContain('sanshiro')
  expect(url.searchParams.get('body')).toContain('Natsume Sōseki')
})


it('replaces duplicate requests with reading the existing layer, including custom names', () => {
  const book: BookMeta = { schema: 1, id: 'sanshiro', mode: 'trilingual_standard', primary: 'ja', langs: ['ja', 'en', 'zh'], title: {}, titleText: { ja: '三四郎' }, author: {}, chapters: [], bytes: 0, paras: 0 }
  const onRead = vi.fn()
  render(<TranslationRequest ui="en" book={book} expanded onRead={onRead} />)
  expect(screen.queryByRole('link', { name: /Open translation request/ })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Read in English' }))
  expect(onRead).toHaveBeenLastCalledWith('en')
  fireEvent.change(screen.getByLabelText('Target language'), { target: { value: 'other' } })
  fireEvent.change(screen.getByLabelText('Another language'), { target: { value: '日本語' } })
  fireEvent.click(screen.getByRole('button', { name: 'Read in Japanese' }))
  expect(onRead).toHaveBeenLastCalledWith('ja')
  expect(screen.queryByRole('link', { name: /Open translation request/ })).toBeNull()
  fireEvent.change(screen.getByLabelText('Target language'), { target: { value: 'fr' } })
  expect(screen.queryByRole('button', { name: /Read in/ })).toBeNull()
  expect(screen.getByRole('link', { name: /Open translation request/ }).getAttribute('href')).toContain('French')
})
