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
