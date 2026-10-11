// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
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
