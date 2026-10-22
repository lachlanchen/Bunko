// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {SharedAccount} from './SharedAccount'
const state=vi.hoisted(()=>({user:{id:1,login:'reader'},listeners:new Set<()=>void>(),status:vi.fn(),connect:vi.fn(),reauth:vi.fn(),github:vi.fn(),api:vi.fn()}))
vi.mock('../lib/discussions',()=>({currentUser:()=>state.user,currentSignInMethod:()=> 'github',subscribeSession:(fn:()=>void)=>{state.listeners.add(fn);return()=>state.listeners.delete(fn)},restoreSession:async()=>{},api:state.api,reauthenticateAccount:state.reauth,connectGitHubAccount:state.github}))
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
it('offers the same explicit linking flow on the updated Mac bridge',async()=>{
 state.connect.mockReturnValue({cancel:vi.fn(),promise:Promise.resolve()});window.__BUNKO_DESKTOP__=true;render(<SharedAccount ui="en" onLogin={()=>{}}/>);fireEvent.click(await screen.findByText('Connect LazyingArt'));expect(state.connect).toHaveBeenCalledOnce()
})

it.each(['account_already_linked','different_account_already_linked','local_reauthentication_required'])('shows actionable %s without changing the account or draft',async code=>{
 const onLogin=vi.fn();state.connect.mockImplementation(()=>({cancel:vi.fn(),promise:Promise.reject({code})}));
 render(<><textarea aria-label="draft" defaultValue="Keep this reading note"/><SharedAccount ui="en" onLogin={onLogin}/></>);
 fireEvent.click(await screen.findByText('Connect LazyingArt'));
 await waitFor(()=>expect(screen.getByRole('status').textContent).toMatch(/unchanged/));
 expect(screen.getByRole('textbox')).toHaveValue('Keep this reading note');expect(state.user.id).toBe(1);expect(onLogin).not.toHaveBeenCalled();expect(state.api).not.toHaveBeenCalled();
 if(code==='account_already_linked')expect(screen.getByText('Choose another LazyingArt account')).toBeInTheDocument();
 if(code==='local_reauthentication_required')expect(screen.getByText('Sign in')).toBeInTheDocument();
 expect(screen.queryByText(/merge accounts/i)).not.toBeInTheDocument();
});

it('offers optional GitHub connection without replacing the reader or draft',async()=>{
 state.status.mockResolvedValue({...status,linked:true,state:'active',github:{available:true,connected:false,state:'unlinked'}})
 state.github.mockReturnValue({cancel:vi.fn(),promise:Promise.resolve()})
 render(<><textarea aria-label="draft" defaultValue="Keep my note"/><SharedAccount ui="en" onLogin={()=>{}}/></>)
 fireEvent.click(await screen.findByText('Connect GitHub'))
 await waitFor(()=>expect(state.github).toHaveBeenCalledOnce())
 expect(state.connect).not.toHaveBeenCalled();expect(state.user.id).toBe(1);expect(screen.getByRole('textbox')).toHaveValue('Keep my note')
})
it('shows the connected GitHub author and a reconnect action after expiry',async()=>{
 state.status.mockResolvedValue({...status,github:{available:true,connected:true,state:'active',login:'reader-seven'}})
 render(<SharedAccount ui="en" onLogin={()=>{}}/>);await screen.findByText('@reader-seven');expect(screen.queryByText('Connect GitHub')).not.toBeInTheDocument()
 state.status.mockResolvedValue({...status,github:{available:true,connected:true,state:'reauthorize',login:'reader-seven'}})
 fireEvent(window,new Event('online'));await screen.findByText('Reconnect GitHub')
})
