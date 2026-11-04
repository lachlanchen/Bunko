import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto'
import {createGitHubConnections} from './github-connection.mjs'
import {cloudOwner} from './cloud-ledger.mjs'
function fixture(t){
 const db=new DatabaseSync(':memory:'),key=randomBytes(32);t.after(()=>db.close())
 const s={time:1000000,active:true,refreshes:0,existing:new Set(),refresh:async()=>({token:'new-token',accessExpires:s.time+3600000,refreshToken:'rotated',refreshExpires:s.time+86400000})}
 const seal=v=>{const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv),encrypted=Buffer.concat([c.update(JSON.stringify(v)),c.final()]);return Buffer.concat([iv,c.getAuthTag(),encrypted]).toString('base64')}
 const unseal=v=>{const b=Buffer.from(v,'base64'),c=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));c.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([c.update(b.subarray(28)),c.final()]))}
 const options={db,seal,unseal,now:()=>s.time,legacyOwnerExists:o=>s.existing.has(o),active:()=>s.active,refresh:async(...args)=>{s.refreshes++;return s.refresh(...args)}}
 s.connection=createGitHubConnections(options);s.otherProcess=()=>createGitHubConnections(options);s.db=db
 s.user={id:'bunko_fixture',login:'Reader'};s.github={id:7,login:'github-reader'};s.owner=cloudOwner(s.user)
 s.connect=()=>s.connection.connect(s.user,s.github,{token:'access-secret',accessExpires:s.time+120000,refreshToken:'refresh-secret',refreshExpires:s.time+86400000})
 return s
}
test('encrypted provider credentials preserve canonical identity across restart and reconnect',async t=>{
 const s=fixture(t),first=s.connect(),again=s.connect();assert.equal(first.epoch,again.epoch)
 const row=s.db.prepare('SELECT * FROM github_connections').get();assert.ok(!JSON.stringify(row).includes('secret'));assert.ok(!row.account.includes('Reader'))
 assert.equal(s.otherProcess().lookup(7).user.id,s.user.id);assert.equal((await s.connection.credential(s.owner)).token,'access-secret')
 assert.throws(()=>s.connection.connect({id:'bunko_other',login:'Other'},s.github,{token:'x',accessExpires:s.time+100000}),{code:'account_already_linked'})
 assert.throws(()=>s.connection.connect(s.user,{id:8,login:'other'},{token:'x',accessExpires:s.time+100000}),{code:'different_github_already_linked'})
})
test('legacy ownership is checked before the first mapping and no row is partly inserted',t=>{
 const s=fixture(t);s.existing.add(cloudOwner(s.github));assert.throws(s.connect,{code:'account_already_linked'});assert.equal(s.connection.status(s.owner).connected,false)
})
test('concurrent credential refresh shares one rotation and another process cannot duplicate it',async t=>{
 const s=fixture(t);s.connect();s.time+=70000
 let release;s.refresh=()=>new Promise(r=>release=r)
 const a=s.connection.credential(s.owner),b=s.connection.credential(s.owner)
 await assert.rejects(s.otherProcess().credential(s.owner),{code:'github_reconnect_required'})
 release({token:'new-token',accessExpires:s.time+3600000,refreshToken:'rotated',refreshExpires:s.time+86400000})
 assert.equal((await a).token,'new-token');assert.equal((await b).token,'new-token');assert.equal(s.refreshes,1)
})
test('unknown refresh outcome requires reauthorization and is not retried',async t=>{
 const s=fixture(t);s.connect();s.time+=70000;s.refresh=async()=>{throw Error('lost response')}
 await assert.rejects(s.connection.credential(s.owner),/lost response/);await assert.rejects(s.connection.credential(s.owner),{code:'github_reconnect_required'});assert.equal(s.refreshes,1);assert.equal(s.connection.status(s.owner).state,'reauthorize')
})
test('late refresh after last session logout cannot revive provider credentials',async t=>{
 const s=fixture(t);s.connect();s.time+=70000;let release;s.refresh=()=>new Promise(r=>release=r)
 const pending=s.connection.credential(s.owner);s.active=false;release({token:'new',accessExpires:s.time+3600000})
 await assert.rejects(pending,{code:'local_session_changed'});assert.equal(s.connection.status(s.owner).state,'reauthorize')
})
test('refresh lease expiry and expired nonrefreshable grants require a fresh connection',async t=>{
 const s=fixture(t);s.connect();s.db.prepare("UPDATE github_connections SET state='refreshing',lease=?").run(s.time-1)
 await assert.rejects(s.connection.credential(s.owner),{code:'github_reconnect_required'});assert.equal(s.connection.status(s.owner).state,'reauthorize')
 s.connection.connect(s.user,s.github,{token:'expired',accessExpires:s.time-1})
 await assert.rejects(s.connection.credential(s.owner),{code:'github_reconnect_required'});assert.equal(s.connection.status(s.owner).state,'reauthorize');assert.equal(s.refreshes,0)
})
