import test from 'node:test';import assert from 'node:assert/strict';import {createHash,randomBytes} from 'node:crypto';import {createService} from './service.mjs';import {fixture,config as sharedConfig} from './shared-link.fixture.mjs';
import {request as httpRequest} from 'node:http';
const opaque=()=>randomBytes(32).toString('base64url'),hash=x=>createHash('sha256').update(x).digest('base64url');
async function setup(t){
 let githubId=7;const f=fixture(t),service=createService({publicUrl:'https://llm.lazying.art/bunko',clientId:'test',clientSecret:'test',encryptionKey:randomBytes(32).toString('base64'),lazyingart:sharedConfig,lacPoints:{enabled:true}},{now:()=>f.time,profileOptions:f.options,fetchImpl:async (url,options={})=>Response.json(url.endsWith('/user')?{id:Number(options.headers.Authorization.split('-').at(-1)),login:'local-reader'}:{access_token:'fixture-token-'+githubId,expires_in:28800})});
 await new Promise(r=>service.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{service.close(r);service.closeAllConnections()}));const root=`http://127.0.0.1:${service.address().port}`;let token;
 const request=(path,body,extra={})=>new Promise((resolve,reject)=>{
  const req=httpRequest(root+'/bunko'+path,{method:body?'POST':'GET',headers:{Host:'llm.lazying.art',...(body?{Origin:'https://lachlan.lazying.art','X-Bunko-Client':'1','Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...extra}},res=>{
   let text='';res.setEncoding('utf8');res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode,headers:new Headers(Object.fromEntries(Object.entries(res.headers).map(([key,value])=>[key,Array.isArray(value)?value.join(', '):value]))),json:async()=>JSON.parse(text)}));
  });req.on('error',reject);req.end(body?JSON.stringify(body):undefined);
 });
 const verifier=opaque(),a=await(await request('/v1/auth/start',{challenge:hash(verifier),platform:'native'})).json();assert.ok(a.url,JSON.stringify(a));await request('/oauth/callback?code=test&state='+new URL(a.url).searchParams.get('state'));token=(await(await request('/v1/auth/complete',{flow:a.flow,verifier})).json()).token;assert.ok(token);
 const start=async()=>{const verifier=opaque(),r=await request('/v1/lazyingart/start',{challenge:hash(verifier),consent:true});assert.equal(r.status,200);const flow=await r.json(),browser=await request(new URL(flow.url).pathname.slice('/bunko'.length)+new URL(flow.url).search);assert.equal(browser.status,303);return{...flow,verifier,cookie:browser.headers.get('set-cookie').split(';')[0],callback:'/oauth/lazyingart/callback?'+new URLSearchParams({state:new URL(browser.headers.get('location')).searchParams.get('state'),iss:sharedConfig.issuer,code:'c'.repeat(43)})}};
 return{f,request,start,setGithubId:id=>{githubId=id},setToken:value=>{token=value}};
}
test('Bunko actual routes bind browser and independent PKCE while preserving existing account; missing points port stays off',async t=>{
 const s=await setup(t);const status=await(await s.request('/v1/lazyingart/status',{})).json();assert.equal(status.enabled,true);assert.equal(status.points,false);
 assert.equal((await s.request('/v1/lazyingart/start',{challenge:opaque(),consent:false})).status,400);assert.equal((await s.request('/v1/lazyingart/start',{challenge:opaque(),consent:true},{Origin:'https://foreign.invalid'})).status,403);
 const f=await s.start();assert.notEqual((await s.request(f.callback)).status,200);assert.equal((await s.request(f.callback,null,{Cookie:f.cookie})).status,200);
 assert.equal((await s.request('/v1/lazyingart/complete',{flow:f.flow,verifier:opaque()})).status,400);assert.deepEqual(await(await s.request('/v1/lazyingart/complete',{flow:f.flow,verifier:f.verifier})).json(),{linked:true});
 assert.equal((await(await s.request('/v1/session',{})).json()).user.id,7);assert.equal((await s.request('/v1/lazyingart/balance',{})).status,503);
 await s.request('/v1/lazyingart/disconnect',{});assert.equal((await(await s.request('/v1/lazyingart/status',{})).json()).linked,false);assert.equal((await s.request('/v1/session',{})).status,200);
});
test('cancel and stale local authentication prevent later shared linking without logging out of Bunko',async t=>{
 const s=await setup(t),f=await s.start();assert.equal((await s.request('/v1/lazyingart/cancel',{flow:f.flow,verifier:f.verifier})).status,200);assert.notEqual((await s.request(f.callback,null,{Cookie:f.cookie})).status,200);assert.equal((await(await s.request('/v1/lazyingart/status',{})).json()).linked,false);
 s.f.time+=601000;assert.equal((await s.request('/v1/lazyingart/start',{challenge:opaque(),consent:true})).status,403);assert.equal((await s.request('/v1/session',{})).status,200);
});

test('a callback collision reaches the app as409 and leaves the initiating session unchanged',async t=>{
 const s=await setup(t),first=await s.start();await s.request(first.callback,null,{Cookie:first.cookie});
 s.setGithubId(8);const verifier=opaque(),login=await(await s.request('/v1/auth/start',{challenge:hash(verifier),platform:'native'})).json();
 await s.request('/oauth/callback?code=test&state='+new URL(login.url).searchParams.get('state'));
 s.setToken((await(await s.request('/v1/auth/complete',{flow:login.flow,verifier})).json()).token);
 const second=await s.start();assert.equal((await s.request(second.callback,null,{Cookie:second.cookie})).status,200);
 assert.equal((await s.request('/v1/lazyingart/complete',{flow:second.flow,verifier:opaque()})).status,400);
 const rejected=await s.request('/v1/lazyingart/complete',{flow:second.flow,verifier:second.verifier});assert.equal(rejected.status,409);assert.equal((await rejected.json()).error,'account_already_linked');
 assert.equal((await(await s.request('/v1/session',{})).json()).user.id,8);
 assert.equal((await(await s.request('/v1/lazyingart/status',{})).json()).linked,false);
});
test('reauthentication rejects a different GitHub account before replacing the current session',async t=>{
 const s=await setup(t);s.setGithubId(8);
 const verifier=opaque(),login=await(await s.request('/v1/auth/start',{challenge:hash(verifier),platform:'native',reauthenticate:true})).json();
 await s.request('/oauth/callback?code=test&state='+new URL(login.url).searchParams.get('state'));
 const result=await s.request('/v1/auth/complete',{flow:login.flow,verifier});assert.equal(result.status,403);assert.equal((await result.json()).error,'local_session_changed');
 assert.equal((await(await s.request('/v1/session',{})).json()).user.id,7);
});
