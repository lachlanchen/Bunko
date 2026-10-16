// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {SharedAccount} from './SharedAccount'
const state=vi.hoisted(()=>({user:{id:1,login:'reader'},listeners:new Set<()=>void>(),status:vi.fn(),connect:vi.fn(),api:vi.fn()}))
vi.mock('../lib/discussions',()=>({currentUser:()=>state.user,subscribeSession:(fn:()=>void)=>{state.listeners.add(fn);return()=>state.listeners.delete(fn)},restoreSession:async()=>{},api:state.api}))
vi.mock('../lib/sharedAccount',()=>({sharedStatus:state.status,connectSharedAccount:state.connect}))
const status={enabled:true,points:false,signedIn:true,eligible:true,linked:false,state:'unlinked'}
beforeEach(()=>{state.user={id:1,login:'reader'};state.status.mockReset().mockResolvedValue(status);state.connect.mockReset();state.api.mockReset();window.__BUNKO_DESKTOP__=false})
afterEach(cleanup)
it('does not show an unqualified feature',async()=>{
 state.status.mockResolvedValue({...status,enabled:false});render(<SharedAccount ui="en" onLogin={()=>{}}/>);await waitFor(()=>expect(state.status).toHaveBeenCalled());expect(screen.queryByText('Connect LazyingArt')).not.toBeInTheDocument()
})
it('keeps status recovery available without duplicating sections',async()=>{
 render(<SharedAccount ui="en" onLogin={()=>{}}/>);await screen.findByText('Connect LazyingArt');state.status.mockRejectedValue(Error('offline'));fireEvent(window,new Event('online'));await screen.findByText('Could not load account connection.');state.status.mockResolvedValue({...status,linked:true,state:'active'});fireEvent.click(screen.getByText('Retry'));await screen.findByText('Account connected');expect(screen.getAllByText('LazyingArt account')).toHaveLength(1)
})
it('cancel and account switch cannot attach a late connection result',async()=>{
 let finish!:()=>void;const cancel=vi.fn();state.connect.mockReturnValue({cancel,promise:new Promise<void>(r=>finish=r)});
 render(<SharedAccount ui="en" onLogin={()=>{}}/>);fireEvent.click(await screen.findByText('Connect LazyingArt'));await screen.findByText('Cancel');act(()=>{state.user={id:2,login:'next'};state.listeners.forEach(fn=>fn())});await waitFor(()=>expect(cancel).toHaveBeenCalledOnce());await act(async()=>finish());expect(screen.queryByText('Account connected')).not.toBeInTheDocument();expect(await screen.findByText('Connect LazyingArt')).toBeInTheDocument()
})
it('does not start a browser flow through an unqualified Mac bridge',async()=>{
 window.__BUNKO_DESKTOP__=true;render(<SharedAccount ui="en" onLogin={()=>{}}/>);await screen.findByText('This Mac connection needs an app update.');expect(screen.queryByText('Connect LazyingArt')).not.toBeInTheDocument();expect(state.connect).not.toHaveBeenCalled()
})
