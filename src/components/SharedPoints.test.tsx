// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import {afterEach,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react'
import {SharedPoints,type SharedPointsState} from './SharedPoints'
afterEach(cleanup)
const text=(key:string)=>key
const ready=(balance:string):SharedPointsState=>({state:'ready',balance,pending:'0',asOf:1900000000,revision:'1'})
it('displays canonical integer strings and a verified zero, but never makes an outage zero',async()=>{
 const load=vi.fn<()=>Promise<SharedPointsState>>().mockResolvedValue(ready('9223372036854775807'))
 render(<SharedPoints load={load} text={text}/>);expect(await screen.findByTestId('shared-lac-balance')).toHaveTextContent('9223372036854775807')
 load.mockRejectedValue(Error('offline'));fireEvent.click(screen.getByText('Refresh shared points'))
 expect(await screen.findByText('Shared points are temporarily unavailable.')).toBeInTheDocument();expect(screen.queryByTestId('shared-lac-balance')).not.toBeInTheDocument()
 load.mockResolvedValue(ready('0'));fireEvent(window,new Event('online'));expect(await screen.findByTestId('shared-lac-balance')).toHaveTextContent('0')
})
it('discards a late balance after an account switch and clears a withdrawn link on refresh',async()=>{
 let finish!:(value:SharedPointsState)=>void
 const view=render(<SharedPoints key="first" load={()=>new Promise(r=>{finish=r})} text={text}/>)
 const next=vi.fn<()=>Promise<SharedPointsState>>().mockResolvedValue(ready('7'))
 view.rerender(<SharedPoints key="second" load={next} text={text}/>);expect(await screen.findByTestId('shared-lac-balance')).toHaveTextContent('7')
 await act(async()=>finish(ready('900')));expect(screen.getByTestId('shared-lac-balance')).toHaveTextContent('7')
 next.mockResolvedValue({state:'link-required'});fireEvent(window,new Event('lazyingart:connection-changed'))
 expect(await screen.findByText('Connect your LazyingArt account to view shared points.')).toBeInTheDocument();expect(screen.queryByTestId('shared-lac-balance')).not.toBeInTheDocument()
})
it('shows separate consent without offering grants, purchases or a fabricated balance',async()=>{
 render(<SharedPoints load={async()=>({state:'consent-required'})} text={text}/>);expect(await screen.findByText('Reading shared points requires separate consent.')).toBeInTheDocument();expect(screen.queryByTestId('shared-lac-balance')).not.toBeInTheDocument();expect(screen.getAllByRole('button')).toHaveLength(1)
})
