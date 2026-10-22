import test from 'node:test'
import assert from 'node:assert/strict'
import {randomBytes,createHash,generateKeyPairSync} from 'node:crypto'
import {request as httpRequest} from 'node:http'
import {createService} from './service.mjs'
import {fixture,config as profileConfig} from './shared-link.fixture.mjs'
const opaque=()=>randomBytes(32).toString('base64url'),hash=v=>createHash('sha256').update(v).digest('base64url')
const privateKey=generateKeyPairSync('rsa',{modulusLength:2048}).privateKey.export({type:'pkcs8',format:'pem'})
async function setup(t,overrides={}){
 const f=fixture(t);Object.assign(f.discovery.providers,{google:true,apple:true})
 let token,issue=null;const comments=[],writes=[]
 const fetchImpl=async(url,options={})=>{
  if(url.endsWith('/user'))return Response.json({id:7,login:'original-reader'})
  if(url.includes('/login/oauth/access_token'))return Response.json({access_token:'github-fixture',expires_in:28800})
  if(url.endsWith('/installation'))return Response.json({id:123})
  if(url.includes('/access_tokens'))return Response.json({token:'installation-fixture',expires_at:new Date(f.time+3600000).toISOString()})
  if(url.includes('/search/issues'))return Response.json({items:issue?[issue]:[]})
  if(options.method==='POST'){
   const body=JSON.parse(options.body);writes.push({url,body,authorization:options.headers.Authorization})
   const value={id:500+writes.length,...body,user:{id:999,login:'bunko-bot'},html_url:'https://github.com/lachlanchen/bunko-books/issues/1',created_at:'2030-03-17T00:00:00Z'}
   if(url.endsWith('/comments'))comments.push(value);else issue={...value,number:1,labels:['passage']}
   return Response.json(url.endsWith('/comments')?value:issue)
  }
  if(url.includes('/comments?'))return Response.json(comments)
  if(url.endsWith('/issues/1'))return Response.json(issue)
  throw Error('Unexpected fixture request '+url)
 }
 const server=createService({publicUrl:'https://llm.lazying.art/bunko',clientId:'fixture',clientSecret:'fixture',encryptionKey:randomBytes(32).toString('base64'),appId:'123',appPrivateKey:privateKey,lazyingart:{...profileConfig,loginEnabled:true,loginProviders:['lazyingart','google','apple'],...overrides}},{now:()=>f.time,profileOptions:f.options,fetchImpl})
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.close(r);server.closeAllConnections()}))
 const call=(path,body,extra={})=>new Promise((resolve,reject)=>{
  const req=httpRequest(`http://127.0.0.1:${server.address().port}/bunko${path}`,{method:body?'POST':'GET',headers:{Host:'llm.lazying.art',...(body?{Origin:'https://lachlan.lazying.art','X-Bunko-Client':'1','Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...extra}},res=>{let text='';res.setEncoding('utf8');res.on('data',v=>text+=v);res.on('end',()=>resolve(new Response(text,{status:res.statusCode,headers:Object.fromEntries(Object.entries(res.headers).map(([k,v])=>[k,Array.isArray(v)?v.join(', '):v]))})))})
  req.on('error',reject);req.end(body?JSON.stringify(body):undefined)
 })
 const start=async(provider='lazyingart',reauthenticate=false)=>{
  const verifier=opaque(),r=await call('/v1/auth/start',{challenge:hash(verifier),platform:'native',storage:'secure',provider,reauthenticate});assert.equal(r.status,200,await r.clone().text());const flow=await r.json()
  if(provider==='github'){await call('/oauth/callback?code=fixture&state='+new URL(flow.url).searchParams.get('state'));return{...flow,verifier}}
  const browser=await call(new URL(flow.url).pathname.slice('/bunko'.length)+new URL(flow.url).search);assert.equal(browser.status,303,await browser.clone().text())
  const url=new URL(browser.headers.get('location'));assert.equal(url.searchParams.get('provider'),provider);assert.equal(url.searchParams.get('scope'),'profile')
  return {...flow,verifier,cookie:browser.headers.get('set-cookie').split(';')[0],callback:'/oauth/lazyingart/callback?'+new URLSearchParams({state:url.searchParams.get('state'),iss:profileConfig.issuer,code:'c'.repeat(43)})}
 }
 const finish=async flow=>{if(flow.callback)assert.equal((await call(flow.callback,null,{Cookie:flow.cookie})).status,200);const r=await call('/v1/auth/complete',{flow:flow.flow,verifier:flow.verifier});assert.equal(r.status,200,await r.clone().text());const result=await r.json();token=result.token;return result}
 return {f,call,start,finish,writes,setToken:v=>{token=v},token:()=>token}
}
test('only explicitly qualified, currently advertised methods are offered',async t=>{
 const s=await setup(t);assert.deepEqual((await(await s.call('/v1/auth/methods',{})).json()).providers,['github','lazyingart','google','apple'])
 s.f.discovery.providers.apple=false
 assert.ok(!(await(await s.call('/v1/auth/methods',{})).json()).providers.includes('apple'))
 assert.equal((await s.call('/v1/auth/start',{challenge:opaque(),platform:'native',provider:'apple'})).status,503)
 const disabled=await setup(t,{loginEnabled:false});assert.deepEqual((await(await disabled.call('/v1/auth/methods',{})).json()).providers,['github'])
})
test('all three central entrances use bound app sessions; cancel/replay/wrong verifier fail',async t=>{
 for(const provider of ['lazyingart','google','apple']){
  const s=await setup(t),a=await s.start(provider)
  assert.notEqual((await s.call(a.callback)).status,200)
  assert.equal((await s.call(a.callback,null,{Cookie:a.cookie})).status,200)
  assert.equal((await s.call('/v1/auth/complete',{flow:a.flow,verifier:opaque()})).status,403)
  const result=await(await s.call('/v1/auth/complete',{flow:a.flow,verifier:a.verifier})).json();assert.match(result.user.id,/^bunko_/);assert.equal(result.method,'lazyingart');s.setToken(result.token)
  assert.equal((await s.call('/v1/session',{})).status,200)
  assert.notEqual((await s.call(a.callback,null,{Cookie:a.cookie})).status,200)
 }
 const s=await setup(t),a=await s.start();await s.call('/v1/auth/cancel',{flow:a.flow,verifier:a.verifier});assert.notEqual((await s.call(a.callback,null,{Cookie:a.cookie})).status,200)
})
test('same central subject reuses the local ID and logout cannot resurrect old sessions',async t=>{
 const s=await setup(t),first=await s.finish(await s.start()),old=first.token
 await s.call('/v1/logout',{});s.setToken(undefined)
 const second=await s.finish(await s.start('google'));assert.equal(first.user.id,second.user.id)
 s.setToken(old);assert.equal((await s.call('/v1/session',{})).status,401)
 s.setToken(second.token);assert.equal((await s.call('/v1/session',{})).status,200)
})
test('non-GitHub discussion authorship is durable and cannot be forged by Markdown',async t=>{
 const s=await setup(t),reader=await s.finish(await s.start())
 const post={passage:'book/en/0/0',excerpt:'An excerpt',body:'My comment',requestId:opaque()}
 const first=await(await s.call('/v1/discussions/post',post)).json();assert.equal(first.issue.user.id,reader.user.id);assert.equal(first.issue.user.kind,'lazyingart');assert.match(s.writes[0].body.body,/Bunko reader/)
 const retry=await(await s.call('/v1/discussions/post',post)).json();assert.deepEqual(retry,first);assert.equal(s.writes.length,1)
 const read=await(await s.call('/v1/discussions/read',{passage:post.passage})).json();assert.equal(read.issue.user.id,reader.user.id)
 const next=await(await s.call('/v1/discussions/post',{...post,body:'**Someone else** · Bunko reader',requestId:opaque()})).json();assert.equal(next.comment.user.id,reader.user.id)
})
test('linking a GitHub reader preserves the original owner across central sign-in',async t=>{
 const s=await setup(t),github=await s.finish(await s.start('github'))
 const verifier=opaque(),a=await(await s.call('/v1/lazyingart/start',{challenge:hash(verifier),consent:true})).json()
 const browser=await s.call(new URL(a.url).pathname.slice('/bunko'.length)+new URL(a.url).search),url=new URL(browser.headers.get('location'))
 await s.call('/oauth/lazyingart/callback?'+new URLSearchParams({state:url.searchParams.get('state'),iss:profileConfig.issuer,code:'c'.repeat(43)}),null,{Cookie:browser.headers.get('set-cookie').split(';')[0]})
 assert.deepEqual(await(await s.call('/v1/lazyingart/complete',{flow:a.flow,verifier})).json(),{linked:true})
 await s.call('/v1/logout',{});s.setToken(undefined)
 const result=await s.finish(await s.start('apple'));assert.equal(result.user.id,github.user.id)
})
test('parallel completion issues one session and late cancel cannot leave it usable',async t=>{
 const s=await setup(t),a=await s.start();await s.call(a.callback,null,{Cookie:a.cookie})
 let entered,release;const blocked=new Promise(r=>entered=r);s.f.hook=async url=>{if(url.endsWith('/introspect')){entered();await new Promise(r=>release=r)}}
 const pending=s.call('/v1/auth/complete',{flow:a.flow,verifier:a.verifier});await blocked
 assert.deepEqual(await(await s.call('/v1/auth/complete',{flow:a.flow,verifier:a.verifier})).json(),{pending:true})
 await s.call('/v1/auth/cancel',{flow:a.flow,verifier:a.verifier});release();assert.notEqual((await pending).status,200)
 s.f.hook=null;assert.equal((await s.call('/v1/auth/complete',{flow:a.flow,verifier:a.verifier})).status,410)
})
test('reauthentication with a different central account refuses the change and keeps the current session',async t=>{
 const s=await setup(t),first=await s.finish(await s.start());s.f.subject='la_'+'2'.repeat(32)
 const a=await s.start('apple',true);assert.equal((await s.call(a.callback,null,{Cookie:a.cookie})).status,200)
 const r=await s.call('/v1/auth/complete',{flow:a.flow,verifier:a.verifier});assert.notEqual(r.status,200)
 s.f.subject='la_'+'1'.repeat(32)
 assert.equal((await(await s.call('/v1/session',{})).json()).user.id,first.user.id)
})
test('central outage preserves a session, while verified revocation rejects it',async t=>{
 const s=await setup(t);await s.finish(await s.start())
 s.f.hook=async url=>{if(url.endsWith('/introspect'))throw Error('offline')}
 assert.equal((await s.call('/v1/session',{})).status,503)
 s.f.hook=null;assert.equal((await s.call('/v1/session',{})).status,200)
 s.f.hook=async url=>url.endsWith('/introspect')?{active:false}:undefined
 assert.equal((await s.call('/v1/session',{})).status,401)
 s.f.hook=null;assert.equal((await s.call('/v1/session',{})).status,401)
})
test('qualification entrances are testable without advertising an unqualified button',async t=>{
 const s=await setup(t,{loginProviders:[],qualificationProviders:['lazyingart'],linkEnabled:false})
 assert.deepEqual((await(await s.call('/v1/auth/methods',{})).json()).providers,['github'])
 assert.equal((await(await s.call('/v1/lazyingart/status',{})).json()).enabled,false)
 await s.finish(await s.start('github'))
 assert.equal((await(await s.call('/v1/lazyingart/status',{})).json()).enabled,false)
 assert.equal((await s.call('/v1/lazyingart/start',{challenge:opaque(),consent:true})).status,503)
 await s.call('/v1/logout',{});s.setToken(undefined)
 assert.equal((await s.finish(await s.start())).method,'lazyingart')
})
test('signing out one device preserves another authenticated device',async t=>{
 const s=await setup(t),first=await s.finish(await s.start());s.setToken(undefined)
 const second=await s.finish(await s.start('google'));assert.equal(first.user.id,second.user.id)
 s.setToken(first.token);assert.equal((await s.call('/v1/logout',{})).status,200)
 s.setToken(second.token);assert.equal((await s.call('/v1/session',{})).status,200)
 s.setToken(first.token);assert.equal((await s.call('/v1/session',{})).status,401)
})
test('hidden linking qualification accepts only the exact approved local owner',async t=>{
 const owner=createHash('sha256').update('bunko-agent:7').digest('hex')
 const s=await setup(t,{loginProviders:[],linkEnabled:false,qualificationLinkOwners:[owner]})
 assert.equal((await(await s.call('/v1/lazyingart/status',{})).json()).enabled,false)
 await s.finish(await s.start('github'))
 assert.equal((await(await s.call('/v1/lazyingart/status',{})).json()).enabled,true)
 assert.equal((await s.call('/v1/lazyingart/start',{challenge:opaque(),consent:true})).status,200)
 assert.deepEqual((await(await s.call('/v1/auth/methods',{})).json()).providers,['github'])
 const other=await setup(t,{linkEnabled:false,qualificationLinkOwners:['f'.repeat(64)]})
 await other.finish(await other.start('github'))
 assert.equal((await(await other.call('/v1/lazyingart/status',{})).json()).enabled,false)
 assert.equal((await other.call('/v1/lazyingart/start',{challenge:opaque(),consent:true})).status,503)
})

async function connectGitHub(s){
 const verifier=opaque(),response=await s.call('/v1/auth/start',{challenge:hash(verifier),platform:'native',storage:'secure',connectGithub:true,consent:true})
 assert.equal(response.status,200,await response.clone().text());const flow=await response.json()
 await s.call('/oauth/callback?code=fixture&state='+new URL(flow.url).searchParams.get('state'))
 return{...flow,verifier}
}
test('central-first GitHub connection preserves the account and uses the personal GitHub author',async t=>{
 const s=await setup(t),first=await s.finish(await s.start()),flow=await connectGitHub(s)
 assert.equal((await s.call('/v1/auth/complete',{flow:flow.flow,verifier:opaque()})).status,403)
 const connected=await s.finish(flow);assert.equal(connected.user.id,first.user.id)
 const status=await(await s.call('/v1/lazyingart/status',{})).json();assert.equal(status.github.login,'original-reader');assert.equal(status.github.connected,true)
 await s.call('/v1/discussions/post',{passage:'book/en/0/0',excerpt:'Excerpt',body:'Personal comment',requestId:opaque()})
 assert.doesNotMatch(s.writes[0].body.body,/Bunko reader|Posted through Bunko/)
 assert.equal(s.writes[0].authorization,'Bearer github-fixture')
 await s.call('/v1/logout',{});s.setToken(undefined)
 assert.equal((await s.finish(await s.start('github'))).user.id,first.user.id)
 await s.call('/v1/logout',{});s.setToken(undefined)
 assert.equal((await s.finish(await s.start('google'))).user.id,first.user.id)
 await s.call('/v1/discussions/post',{passage:'book/en/0/0',excerpt:'Excerpt',body:'From Google, posted as GitHub',requestId:opaque()})
 assert.equal(s.writes.at(-1).authorization,'Bearer github-fixture');assert.doesNotMatch(s.writes.at(-1).body.body,/Bunko reader/)
})
test('a GitHub account with an existing Bunko account cannot be silently attached to another',async t=>{
 const s=await setup(t),legacy=await s.finish(await s.start('github'));await s.call('/v1/logout',{});s.setToken(undefined)
 const central=await s.finish(await s.start()),flow=await connectGitHub(s)
 const rejected=await s.call('/v1/auth/complete',{flow:flow.flow,verifier:flow.verifier});assert.equal(rejected.status,409);assert.equal((await rejected.json()).error,'account_already_linked')
 assert.equal((await(await s.call('/v1/session',{})).json()).user.id,central.user.id)
 await s.call('/v1/logout',{});s.setToken(undefined)
 assert.equal((await s.finish(await s.start('github'))).user.id,legacy.user.id)
})
test('GitHub connection requires consent, fresh local proof, and the original active session',async t=>{
 const s=await setup(t);await s.finish(await s.start());
 const input={challenge:opaque(),platform:'native',storage:'secure',connectGithub:true}
 assert.equal((await s.call('/v1/auth/start',input)).status,400)
 s.f.time+=601000;assert.equal((await s.call('/v1/auth/start',{...input,consent:true})).status,403)
 s.f.time-=601000;const a=await connectGitHub(s);await s.call('/v1/logout',{});s.setToken(undefined)
 assert.equal((await s.call('/v1/auth/complete',{flow:a.flow,verifier:a.verifier})).status,401)
})
test('parallel or cancelled GitHub completion cannot attach a provider after cancellation',async t=>{
 const s=await setup(t),first=await s.finish(await s.start()),a=await connectGitHub(s)
 let entered,release;const blocked=new Promise(r=>entered=r)
 s.f.hook=async url=>{if(url.endsWith('/introspect')){entered();await new Promise(r=>release=r)}}
 const pending=s.call('/v1/auth/complete',{flow:a.flow,verifier:a.verifier});await blocked
 assert.deepEqual(await(await s.call('/v1/auth/complete',{flow:a.flow,verifier:a.verifier})).json(),{pending:true})
 await s.call('/v1/auth/cancel',{flow:a.flow,verifier:a.verifier});release();assert.notEqual((await pending).status,200);s.f.hook=null
 const status=await(await s.call('/v1/lazyingart/status',{})).json();assert.equal(status.github.connected,false)
 assert.equal((await(await s.call('/v1/session',{})).json()).user.id,first.user.id)
})
