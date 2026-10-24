import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readingGeography,geographyContext} from './agent/reading-geography.mjs'

test('old saved Foguoji map gains modern search names without mutating history, facts or citations',()=>{
 const original={key:'saved-result',reference:{id:'foguoji'},places:[{id:'start',name:'長安',aliases:[],citations:[{quote:'長安'}]}],routes:[]}
 const before=JSON.stringify(original),result=readingGeography(original)
 assert.deepEqual(result.places[0].aliases,['Xian']);assert.equal(JSON.stringify(original),before)
 assert.equal(result.routes,original.routes);assert.equal(result.key,original.key);assert.equal(result.places[0].citations,original.places[0].citations)
 assert.equal(readingGeography({...original,reference:{id:'another-book'}}).places,original.places)
})
test('disputed regions are not geocoded to a guessed capital and geography context is not itinerary evidence',()=>{
 const guide={reference:{id:'foguoji'},places:[{name:'師子國',aliases:[]},{name:'耶婆提',aliases:[]}]}
 assert.deepEqual(readingGeography(guide),guide)
 const context=geographyContext('foguoji');assert.match(context.purpose,/not evidence/);assert.ok(context.noExactPin.includes('中國'));assert.equal(geographyContext('other'),undefined)
})
