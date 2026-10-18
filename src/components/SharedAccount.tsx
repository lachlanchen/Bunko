import {useEffect,useRef,useState,useSyncExternalStore} from 'react'
import {api,currentUser,restoreSession,subscribeSession,reauthenticateAccount} from '../lib/discussions'
import {sharedStatus,connectSharedAccount,type SharedStatus} from '../lib/sharedAccount'
import {SharedPoints,type SharedPointsState} from './SharedPoints'
import pointsCopy from '../shared-points-locales.json'
import linkCopy from '../account-link-copy.json'
import type {UILanguage} from '../i18n'
const words={
 en:['LazyingArt account','Linking leaves your books, notes and purchases in Bunko.','Account connected','Connect LazyingArt','Disconnect LazyingArt','Cancel','Checking account connection…','Could not load account connection.','Retry','Sign in to Bunko before connecting your personal account.','Sign in','Sign in again to connect your account.','Connection did not finish. Please try again.','This Mac connection needs an app update.','Updating account connection…'],
 'zh-Hans':['LazyingArt 账号','关联后，书籍、笔记和购买项目仍保留在 Bunko。','账号已连接','连接 LazyingArt','断开 LazyingArt','取消','正在检查账号连接…','无法加载账号连接状态。','重试','请先登录 Bunko，再关联你的个人账号。','登录','请重新登录后关联账号。','连接未完成，请重试。','此 Mac 的账号连接需要更新应用。','正在更新账号连接…'],
 'zh-Hant':['LazyingArt 帳號','連結後，書籍、筆記和購買項目仍保留在 Bunko。','帳號已連接','連接 LazyingArt','中斷 LazyingArt 連接','取消','正在檢查帳號連線…','無法載入帳號連線狀態。','重試','請先登入 Bunko，再連結你的個人帳號。','登入','請重新登入後連結帳號。','連線未完成，請重試。','此 Mac 的帳號連接需要更新應用程式。','正在更新帳號連線…'],
 ja:['LazyingArt アカウント','連携後も書籍、ノート、購入は Bunko に保持されます。','アカウント接続済み','LazyingArt に接続','LazyingArt の接続を解除','キャンセル','アカウントの接続を確認中…','アカウントの接続を読み込めません。','再試行','個人アカウントを連携する前に Bunko にログインしてください。','ログイン','再度ログインしてからアカウントを連携してください。','接続が完了しませんでした。もう一度お試しください。','この Mac での接続にはアプリの更新が必要です。','アカウントの接続を更新中…'],
}
export function SharedAccount({ui,onLogin}:{ui:UILanguage;onLogin:()=>void}) {
 const user=useSyncExternalStore(subscribeSession,currentUser)
 useEffect(()=>{void restoreSession().catch(()=>{})},[])
 return <AccountConnection key={user?.id??'anonymous'} ui={ui} onLogin={onLogin}/>
}
function AccountConnection({ui,onLogin}:{ui:UILanguage;onLogin:()=>void}) {
 const [status,setStatus]=useState<SharedStatus|null>(null),[error,setError]=useState(''),[linkError,setLinkError]=useState(''),[attempt,setAttempt]=useState(0),[busy,setBusy]=useState(false)
 const epoch=useRef(0),pending=useRef<{cancel:()=>void}|null>(null),copy=words[ui],help=linkCopy[ui]
 useEffect(()=>{
  let active=true
  void sharedStatus().then(v=>{if(active){setStatus(v);setError('')}}).catch(()=>{if(active)setError(copy[7])})
  return()=>{active=false}
 },[attempt,copy])
 useEffect(()=>()=>{epoch.current++;pending.current?.cancel();pending.current=null},[])
 useEffect(()=>{const refresh=()=>setAttempt(v=>v+1);window.addEventListener('online',refresh);return()=>window.removeEventListener('online',refresh)},[])
 if(!status?.enabled)return null
 const refresh=()=>setAttempt(v=>v+1)
 async function connect(){if(pending.current)return;const id=epoch.current;setBusy(true);setError('');setLinkError('');const flow=connectSharedAccount();pending.current=flow;try{await flow.promise;if(epoch.current===id)refresh()}catch(e){if(epoch.current===id)setLinkError((e as {code?:string}).code||'unavailable')}finally{if(epoch.current===id){setBusy(false);pending.current=null}}}
 async function reauthenticate(){
  if(pending.current)return
  const id=epoch.current;setBusy(true);setLinkError('');const flow=reauthenticateAccount();pending.current=flow
  try{await flow.promise;if(id===epoch.current)refresh()}catch(e){if(id===epoch.current)setLinkError((e as {code?:string}).code||'unavailable')}finally{if(id===epoch.current){setBusy(false);pending.current=null}}
 }
 async function disconnect(){const id=epoch.current;setBusy(true);try{await api('/v1/lazyingart/disconnect',{});if(epoch.current===id)refresh()}catch{if(epoch.current===id)setError(copy[12])}finally{if(epoch.current===id)setBusy(false)}}
 const text=(key:string)=>(pointsCopy[ui] as Record<string,string>)[key]||key
 const balance=async():Promise<SharedPointsState>=>{try{return await api<SharedPointsState>('/v1/lazyingart/balance',{})}catch(e){const code=(e as {code?:string}).code;return {state:code==='points_consent_required'?'consent-required':code==='points_link_required'?'link-required':'unavailable'}}}
 return <section className="shared-account">
  <h3>{copy[0]}</h3><p className="hint">{help.intro}</p><p>{help.methods}: GitHub</p><p className="hint">{copy[1]}</p>
  {linkError&&<div role="status"><p>{(help as Record<string,string>)[linkError]||copy[12]}</p>{linkError==='local_reauthentication_required'&&<button disabled={busy} onClick={()=>void reauthenticate()}>{copy[10]}</button>}<button disabled={busy} onClick={()=>setLinkError('')}>{copy[5]}</button></div>}
  {error&&<><p role="status">{error}</p><button disabled={busy} onClick={refresh}>{copy[8]}</button></>}
  {!status.eligible?<><p>{copy[9]}</p><button onClick={onLogin}>{copy[10]}</button></>:status.state==='refreshing'?<><p role="status">{copy[14]}</p><button onClick={refresh}>{copy[8]}</button></>:status.linked?<><p>{copy[2]}</p><button disabled={busy} onClick={()=>void disconnect()}>{copy[4]}</button></>:window.__BUNKO_DESKTOP__?<p>{copy[13]}</p>:<button disabled={busy} onClick={()=>void connect()}>{linkError==='account_already_linked'?help.choose:copy[3]}</button>}
  {busy&&<button onClick={()=>{pending.current?.cancel();setLinkError('authorization_cancelled');setBusy(false)}}>{copy[5]}</button>}
  {status.linked&&status.points&&<SharedPoints load={balance} text={text}/>}
 </section>
}
