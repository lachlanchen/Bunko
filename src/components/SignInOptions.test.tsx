// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {SignInOptions} from './SignInOptions'
const call=vi.hoisted(()=>vi.fn())
vi.mock('../lib/discussions',()=>({api:call}))
afterEach(cleanup)
it('shows only server-qualified methods and sends the selected provider',async()=>{
 call.mockResolvedValue({providers:['github','google','apple','lazyingart','unknown']})
 const select=vi.fn();render(<SignInOptions ui="en" onSelect={select}/>)
 fireEvent.click(await screen.findByRole('button',{name:'Continue with Apple'}))
 expect(select).toHaveBeenCalledWith('apple');expect(screen.getAllByRole('button')).toHaveLength(4)
})
it('keeps GitHub available during a method-discovery outage',async()=>{
 call.mockRejectedValue(Error('offline'));render(<SignInOptions ui="ja" onSelect={()=>{}}/>)
 expect(await screen.findByRole('button',{name:/GitHub/})).toBeEnabled()
 expect(screen.queryByRole('button',{name:/Apple/})).not.toBeInTheDocument()
})
