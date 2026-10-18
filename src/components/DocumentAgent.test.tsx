// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react'
import {DocumentAgent} from './DocumentAgent'
const fixture=vi.hoisted(()=>({user:{id:1,login:'reader'},resize:()=>{}}))
vi.mock('../lib/discussions',()=>({currentUser:()=>fixture.user,subscribeSession:()=>()=>{},restoreSession:async()=>{},signIn:vi.fn(),signOut:vi.fn(),requestId:()=> 'request',DiscussionError:class extends Error{}}))
vi.mock('../lib/documentAgent',()=>({agentCall:async(action:string)=>action==='state'?{documents:[]}:{messages:[{id:'m',state:'ready',question:'A reading question',answer:'A reply',papers:[]}]},uploadDocument:vi.fn()}))
vi.mock('../lib/backNavigation',()=>({useBackAction:()=>{}}))
vi.mock('./DocumentContent',()=>({DocumentContent:({text}:{text:string})=><p>{text}</p>}))
vi.mock('./DemoAccount',()=>({DemoAccount:()=>null,DemoNotice:()=>null}))
vi.mock('./CloudPlans',()=>({CloudPlans:({onBack}:{onBack:()=>void})=><button onClick={onBack}>Back to reading</button>}))
beforeEach(()=>{vi.stubGlobal('ResizeObserver',class{constructor(callback:()=>void){fixture.resize=callback}observe(){}disconnect(){}})})
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it('follows rendered replies but preserves a deliberate scroll into older messages',async()=>{
 render(<DocumentAgent ui="en" onBack={()=>{}}/>);await screen.findByText('A reply')
 const log=screen.getByRole('log');Object.defineProperties(log,{scrollHeight:{value:1000,configurable:true},clientHeight:{value:100,configurable:true}})
 // A rendering/reflow scroll is not a request to stop following the answer.
 log.scrollTop=300;fireEvent.scroll(log);act(()=>fixture.resize());expect(log.scrollTop).toBe(1000)
 fireEvent.wheel(log,{deltaY:-200});log.scrollTop=100;fireEvent.scroll(log);act(()=>fixture.resize());expect(log.scrollTop).toBe(100)
 fireEvent.click(screen.getByRole('button',{name:'Latest message'}));expect(log.scrollTop).toBe(1000)
})
it('opening reading plans preserves the draft and leaves no helper paragraphs after the composer',async()=>{
 render(<DocumentAgent ui="en" onBack={()=>{}}/>);await screen.findByText('A reply')
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'Keep this question'}})
 fireEvent.click(screen.getByLabelText('More'));fireEvent.click(screen.getByRole('button',{name:'Reading plans'}));fireEvent.click(screen.getByRole('button',{name:'Back to reading'}))
 expect(screen.getByRole('textbox')).toHaveValue('Keep this question')
 expect(screen.getByRole('textbox').closest('form')?.nextElementSibling).toBeNull()
 expect(screen.queryByText('Find open papers')).not.toBeInTheDocument()
})
