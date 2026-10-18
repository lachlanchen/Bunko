import {describe,it,expect} from 'vitest'
import {bookIdFromLink} from './bookLink'
describe('native book links',()=>{
 it('opens a generated custom link without relying on URL authority parsing',()=>{
  expect(bookIdFromLink('art.lazying.bunko://book/sanshiro')).toBe('sanshiro')
 })
 it('denies unrelated destinations and ambiguous or encoded paths',()=>{
  for(const value of ['https://example.org/book/sanshiro','art.lazying.bunko://oauth/complete','art.lazying.bunko://book/a/b','art.lazying.bunko://book/../a','art.lazying.bunko://book/%73anshiro','art.lazying.bunko://book/sanshiro?token=x','art.lazying.bunko://book/sanshiro#x','art.lazying.bunko://user@book/sanshiro'])expect(bookIdFromLink(value)).toBeNull()
 })
})
