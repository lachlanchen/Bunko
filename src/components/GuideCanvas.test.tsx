// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import {afterEach,expect,it} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {GuideCanvas} from './GuideCanvas'
afterEach(cleanup)
it('allows keyboard panning/reset, and wheel zoom only on deliberate focus',()=>{
 render(<GuideCanvas width={720} height={460} label="Map" ui="en"><circle cx="300" cy="200" r="10"/></GuideCanvas>)
 const chart=screen.getByRole('group',{name:'Map'}),original=chart.getAttribute('viewBox')
 fireEvent.wheel(chart,{deltaY:-100});expect(chart.getAttribute('viewBox')).toBe(original)
 chart.focus();fireEvent.wheel(chart,{deltaY:-100});expect(chart.getAttribute('viewBox')).not.toBe(original)
 fireEvent.keyDown(chart,{key:'Home'});expect(chart.getAttribute('viewBox')).toBe(original)
 fireEvent.keyDown(chart,{key:'ArrowRight'});expect(chart.getAttribute('viewBox')).not.toBe(original)
 fireEvent.keyDown(chart,{key:'Home'});expect(chart.getAttribute('viewBox')).toBe(original)
})
it('restores only the same artifact camera and ignores malformed stored geometry',()=>{
 sessionStorage.clear()
 const props={width:720,height:460,label:'Saved map',ui:'en' as const,stateKey:'artifact-one'}
 render(<GuideCanvas {...props}><circle cx="300" cy="200" r="10"/></GuideCanvas>)
 const chart=screen.getByRole('group',{name:'Saved map'})
 fireEvent.keyDown(chart,{key:'ArrowRight'});fireEvent.keyDown(chart,{key:'+'})
 const moved=chart.getAttribute('viewBox');cleanup()
 render(<GuideCanvas {...props}><circle cx="300" cy="200" r="10"/></GuideCanvas>)
 expect(screen.getByRole('group',{name:'Saved map'}).getAttribute('viewBox')).toBe(moved);cleanup()
 sessionStorage.setItem('bunko-guide-camera:artifact-two',JSON.stringify({x:1e20,y:0,zoom:-1}))
 render(<GuideCanvas {...props} stateKey="artifact-two"><circle cx="300" cy="200" r="10"/></GuideCanvas>)
 const value=screen.getByRole('group',{name:'Saved map'}).getAttribute('viewBox')!
 expect(value).not.toBe(moved);expect(value).not.toMatch(/NaN|Infinity/)
})
