// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TranslationRequest } from './TranslationRequest'
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
