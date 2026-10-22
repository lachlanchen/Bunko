import {randomUUID} from 'node:crypto'
import {cloudOwner} from './cloud-ledger.mjs'
import {ProfileLinkError} from './lazyingart-profile.mjs'

/** Optional, explicit GitHub connection. A provider ID never replaces a Bunko ID. */
export function createGitHubConnections({db,seal,unseal,now,legacyOwnerExists,refresh,active}) {
  db.exec(`CREATE TABLE IF NOT EXISTS github_connections(
    owner TEXT PRIMARY KEY, github_id INTEGER UNIQUE NOT NULL, account TEXT NOT NULL,
    credentials TEXT NOT NULL, state TEXT NOT NULL, generation TEXT NOT NULL,
    epoch TEXT NOT NULL, lease INTEGER NOT NULL DEFAULT 0)`)
  const rowFor=owner=>db.prepare('SELECT * FROM github_connections WHERE owner=?').get(owner)
  const decode=row=>{
    const account=unseal(row.account)
    if(account.owner!==row.owner||account.github.id!==row.github_id||cloudOwner(account.user)!==row.owner)throw new ProfileLinkError('profile_store_unavailable')
    return account
  }
  function lookup(id){const row=db.prepare('SELECT * FROM github_connections WHERE github_id=?').get(id);return row?{...decode(row),epoch:row.epoch}:null}
  function connect(user,github,credentials){
    if(typeof credentials.token!=='string'||!credentials.token||!Number.isFinite(credentials.accessExpires))throw new ProfileLinkError('identity_invalid')
    if(!Number.isSafeInteger(github.id)||github.id<=0||typeof github.login!=='string')throw new ProfileLinkError('identity_invalid')
    const owner=cloudOwner(user),legacy=cloudOwner(github)
    db.exec('BEGIN IMMEDIATE')
    try{
      const previous=rowFor(owner),other=lookup(github.id)
      if((other&&other.owner!==owner)||(!other&&legacy!==owner&&legacyOwnerExists(legacy)))throw new ProfileLinkError('account_already_linked')
      if(previous&&previous.github_id!==github.id)throw new ProfileLinkError('different_github_already_linked')
      const epoch=previous?.epoch||randomUUID(),account={owner,user,github}
      db.prepare('INSERT INTO github_connections VALUES(?,?,?,?,?,?,?,0) ON CONFLICT(owner) DO UPDATE SET account=excluded.account,credentials=excluded.credentials,state=excluded.state,generation=excluded.generation,lease=0').run(owner,github.id,seal(account),seal({owner,githubId:github.id,token:credentials.token,accessExpires:credentials.accessExpires,refreshToken:credentials.refreshToken,refreshExpires:credentials.refreshExpires}),'active',randomUUID(),epoch)
      db.exec('COMMIT');return{user,epoch}
    }catch(e){db.exec('ROLLBACK');throw e}
  }
  const pending=new Map()
  async function credentialOnce(owner){
    let row=rowFor(owner);if(!row)return null
    const account=decode(row)
    if(row.state==='refreshing'&&row.lease<=now())db.prepare("UPDATE github_connections SET state='reauthorize',lease=0 WHERE owner=? AND generation=?").run(owner,row.generation)
    if(row.state!=='active')throw new ProfileLinkError('github_reconnect_required')
    let data=unseal(row.credentials)
    if(data.owner!==owner||data.githubId!==row.github_id)throw new ProfileLinkError('profile_store_unavailable')
    if(data.accessExpires<=now()+60000){
      if(!data.refreshToken||data.refreshExpires<=now()){db.prepare("UPDATE github_connections SET state='reauthorize' WHERE owner=? AND generation=?").run(owner,row.generation);throw new ProfileLinkError('github_reconnect_required')}
      const generation=randomUUID()
      const changed=db.prepare("UPDATE github_connections SET state='refreshing',generation=?,lease=? WHERE owner=? AND generation=? AND state='active'").run(generation,now()+90000,owner,row.generation)
      if(changed.changes!==1)throw new ProfileLinkError('profile_refresh_busy')
      try{
        const fresh=await refresh(data,account.github)
        const current=rowFor(owner)
        if(!active(owner)||current?.state!=='refreshing'||current.generation!==generation||current.lease<=now())throw new ProfileLinkError('local_session_changed')
        data={owner,githubId:row.github_id,...fresh}
        db.prepare("UPDATE github_connections SET credentials=?,state='active',lease=0 WHERE owner=? AND generation=?").run(seal(data),owner,generation)
        row=rowFor(owner)
      }catch(e){db.prepare("UPDATE github_connections SET state='reauthorize',lease=0 WHERE owner=? AND generation=? AND state='refreshing'").run(owner,generation);throw e}
    }
    return{token:data.token,github:account.github,epoch:row.epoch}
  }
  function credential(owner){if(pending.has(owner))return pending.get(owner);const promise=credentialOnce(owner).finally(()=>{if(pending.get(owner)===promise)pending.delete(owner)});pending.set(owner,promise);return promise}
  const status=owner=>{const row=rowFor(owner);return row?{connected:true,state:row.state,login:decode(row).github.login}:{connected:false,state:'unlinked'}}
  return{lookup,connect,credential,status}
}
