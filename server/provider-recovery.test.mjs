import {test} from 'node:test'
import assert from 'node:assert/strict'
import {providerJSON} from './agent/network.mjs'

test('only qualified transient transport failures are marked for bounded model fallback',async t=>{
  const failure=new TypeError('socket failure',{cause:{code:'ECONNRESET'}})
  t.mock.method(globalThis,'fetch',async()=>{throw failure})
  await assert.rejects(providerJSON('https://configured.invalid'),e=>e.retryable===true&&e.status===502)
  const controller=new AbortController();controller.abort()
  await assert.rejects(providerJSON('https://configured.invalid',{signal:controller.signal}),e=>e===failure&&!e.retryable)
})
test('an attempt timeout is retryable, while authentication and unreadable results are not',async t=>{
  const keepAlive=setTimeout(()=>{},1000);t.after(()=>clearTimeout(keepAlive))
  const mocked=t.mock.method(globalThis,'fetch',async(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true})))
  await assert.rejects(providerJSON('https://configured.invalid',{timeout:15}),e=>e.retryable===true&&e.status===504)
  mocked.mock.mockImplementation(async()=>new Response('',{status:401}))
  await assert.rejects(providerJSON('https://configured.invalid'),e=>e.retryable===false)
  mocked.mock.mockImplementation(async()=>new Response('not JSON'))
  await assert.rejects(providerJSON('https://configured.invalid'),e=>!e.retryable&&/unreadable/.test(e.message))
})
