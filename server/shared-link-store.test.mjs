import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {createProfileStore} from './shared-link-store.mjs';import {fixture,config} from './shared-link.fixture.mjs';
const binding='b'.repeat(43),subject='la_'+'1'.repeat(32);
test('Bunko requires a fresh app session and explicit linking; default off has no tables',async t=>{
 const db=new DatabaseSync(':memory:');assert.deepEqual(createProfileStore({db},{}),{enabled:false});assert.equal(db.prepare('SELECT count(*) n FROM sqlite_master').get().n,0);db.close();
 const s=fixture(t);await assert.rejects(s.start({}),{code:'local_reauthentication_required'});await assert.rejects(s.start({...s.context,authenticatedAt:s.time-601000}),{code:'local_reauthentication_required'});
 const a=await s.start();assert.equal(a.url.searchParams.get('prompt'),'login');assert.equal(a.url.searchParams.get('scope'),'profile');assert.equal(a.url.searchParams.get('reuse_consent'),'false');
});
test('link preserves local account and credits, rejects collisions, survives reopening with encrypted credentials',async t=>{
 const s=fixture(t);s.db.exec('CREATE TABLE purchased_credits(amount INTEGER);INSERT INTO purchased_credits VALUES(45)');const result=await s.finish();assert.equal(result.user.id,7);assert.equal(result.linked,true);assert.equal(s.db.prepare('SELECT amount FROM purchased_credits').get().amount,45);
 const row=s.db.prepare('SELECT body FROM profile_links').get();assert.ok(!row.body.includes('r'.repeat(64)));s.link=createProfileStore(s.store,config,s.options);assert.equal((await s.link.proof('reader')).identity.subject,subject);
 await assert.rejects(s.finish({...s.context,owner:'other-reader',sessionHash:'other-session'}),{code:'account_already_linked'});assert.equal(s.db.prepare('SELECT count(*) n FROM profile_links').get().n,1);
});
test('canceled flow cannot link on late callback; orphan credentials are durably revoked',async t=>{
 const s=fixture(t),a=await s.start();s.flow=false;await assert.rejects(s.link.complete({callbackUrl:a.callbackUrl,binding}),{code:'local_session_changed'});assert.equal(s.db.prepare('SELECT count(*) n FROM profile_links').get().n,0);assert.equal(s.db.prepare('SELECT count(*) n FROM profile_revocations').get().n,1);await s.link.flushRevocations();assert.equal(s.db.prepare('SELECT count(*) n FROM profile_revocations').get().n,0);
});
test('logout during proof and unknown refresh never restore or replay a link',async t=>{
 const s=fixture(t);await s.finish();let release,entered;const started=new Promise(r=>entered=r);s.hook=async url=>{if(url.endsWith('/introspect')){entered();await new Promise(r=>release=r)}};const p=s.link.proof('reader');await started;s.link.disconnect('reader');release();await assert.rejects(p,{code:'profile_session_changed'});assert.equal(s.link.status('reader').linked,false);
 s.hook=null;await s.finish();s.time+=580000;const second=createProfileStore(s.store,config,s.options);let free,enteredRefresh;const waiting=new Promise(r=>enteredRefresh=r);s.hook=async(url,body)=>{if(url.endsWith('/token')&&body.grant_type==='refresh_token'){enteredRefresh();await new Promise(r=>free=r);throw Error('unknown')}};const pending=s.link.proof('reader');await waiting;await assert.rejects(second.proof('reader'),{code:'profile_refresh_busy'});free();await assert.rejects(pending);await assert.rejects(second.proof('reader'),{code:'reconnect_required'});assert.equal(s.requests.filter(r=>r.body?.grant_type==='refresh_token').length,1);
});
test('removing a link keeps revocation durable without nested transactions',async t=>{
 const s=fixture(t);await s.finish();s.link.remove('reader');assert.equal(s.db.prepare('SELECT count(*) n FROM profile_links').get().n,0);assert.equal(s.db.prepare('SELECT count(*) n FROM profile_revocations').get().n,1);await s.link.flushRevocations();assert.equal(s.db.prepare('SELECT count(*) n FROM profile_revocations').get().n,0);
});
