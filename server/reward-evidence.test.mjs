import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createRewardEvidence,canonicalEvidence} from './reward-evidence.mjs';
import {createRewardSourceRoutes} from './reward-source-routes.mjs';
import {createRewardSource} from './reward-source.mjs';
import {PROFILE_BINDING as B} from './lazyingart-profile.mjs';
import {hash} from './reward-common.mjs';

test('Bunko foreground activity keeps a durable original-subject event and outbox without any balance grant',async t=>{
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());let subject='la_'+'1'.repeat(32),active=true,time=1900000000000;
 const store={db,active:()=>active,requireActive(){if(!active)throw Error('inactive')}};
 const authorize=async(owner,scope)=>{assert.equal(owner,'reader');return {...B,subject,scope}};
 let evidence=createRewardEvidence(store,{authorize,now:()=>time});
 const claims=await Promise.all(Array.from({length:8},()=>evidence.checkIn({id:'reader'})));
 assert.ok(claims.every(c=>c.event_id===claims[0].event_id));const event=claims[0];assert.equal(event.policy_version,2);
 assert.equal(db.prepare('SELECT count(*) n FROM lac_activity_outbox').get().n,1);
 const binding={issuer:B.issuer,actor:B.clientId,subject,reference:event.evidence_ref,scope:'lac.points.intents.write'};
 const record=(await evidence.read(binding)).record;assert.equal(record.schema,'lac-activity-evidence-v2');assert.equal(record.facts.activity_rule,'bunko-foreground-use-v2');assert.equal(hash(canonicalEvidence(record)),event.evidence_sha256);
 evidence=createRewardEvidence(store,{authorize,now:()=>time});assert.deepEqual(await evidence.checkIn({id:'reader'}),event);
 evidence.hold('reader');assert.equal(db.prepare('SELECT state FROM lac_activity_outbox').get().state,'held');
 subject='la_'+'2'.repeat(32);await evidence.resume('reader');assert.equal(db.prepare('SELECT state FROM lac_activity_outbox').get().state,'held');
 subject=binding.subject;await evidence.resume('reader');assert.equal(db.prepare('SELECT state FROM lac_activity_outbox').get().state,'pending');
 const source=createRewardSource({secret:'s'.repeat(64),evidence,now:()=>time});
 const response=await source.handle({operation:'evidence',method:'POST',headers:{'x-lac-source-key':'s'.repeat(64),'content-type':'application/json'},body:Buffer.from(JSON.stringify({schema_version:1,issuer:B.issuer,actor:B.clientId,subject,nonce:'a'.repeat(48),evidence_ref:event.evidence_ref}))});
 assert.deepEqual(response.evidence,record);assert.equal(response.actor,'bunko-server');
 time+=86400_000;db.exec("CREATE TRIGGER fail_outbox BEFORE INSERT ON lac_activity_outbox BEGIN SELECT RAISE(ABORT,'fixture disk failure'); END");
 await assert.rejects(evidence.checkIn({id:'reader'}));assert.equal(db.prepare('SELECT count(*) n FROM lac_source_evidence').get().n,1);
 active=false;await assert.rejects(evidence.read(binding));
});

test('unqualified Bunko activity stays disabled without source tables or secret reads',async t=>{
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());const routes=createRewardSourceRoutes({db},{origin:'https://llm.lazying.art',rewardSource:{enabled:false,secretFile:'/does-not-exist'}});
 assert.deepEqual(await routes.foreground({id:'reader'}),{enabled:false});assert.equal(db.prepare("SELECT count(*) n FROM sqlite_master WHERE name LIKE 'lac_%'").get().n,0);
});
