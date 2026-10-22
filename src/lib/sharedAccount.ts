import {Capacitor} from '@capacitor/core'
import {Browser} from '@capacitor/browser'
import {api,requestId,sessionRevision,DiscussionError} from './discussions'
export type SharedStatus={enabled:boolean;points:boolean;signedIn:boolean;eligible:boolean;linked:boolean;state:string;github?:{available:boolean;connected:boolean;state:string;login?:string}}
export const sharedStatus=()=>api<SharedStatus>('/v1/lazyingart/status',{})
// Only profile linking uses this browser. Points requires its own SDK consent.
export function connectSharedAccount(){
 const popup=!Capacitor.isNativePlatform()&&!window.__BUNKO_DESKTOP__?window.open('about:blank','bunko-lazyingart','popup,width=520,height=700'):null
 if(popup)popup.opener=null
 const controller=new AbortController(),revision=sessionRevision();let flow:{flow:string;verifier:string}|undefined,finished=false
 const cancel=()=>{controller.abort();popup?.close();if(Capacitor.isNativePlatform())void Browser.close().catch(()=>{});if(window.__BUNKO_DESKTOP__)void window.webkit?.messageHandlers.bunkoAuth.postMessage({cancel:true});if(flow&&!finished)void api('/v1/lazyingart/cancel',flow).catch(()=>{})}
 const promise=(async()=>{
  if(!Capacitor.isNativePlatform()&&!window.__BUNKO_DESKTOP__&&!popup)throw new DiscussionError('popup_blocked')
  const verifier=requestId(),bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)))
  const challenge=btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
  const start=await api<{flow:string;url:string}>('/v1/lazyingart/start',{challenge,consent:true,platform:Capacitor.isNativePlatform()||window.__BUNKO_DESKTOP__?'native':'web'},controller.signal)
  flow={flow:start.flow,verifier}
  if(controller.signal.aborted||revision!==sessionRevision())throw new DiscussionError('authorization_cancelled')
  const url=new URL(start.url)
  if(url.origin!=='https://llm.lazying.art'||url.pathname!=='/bunko/oauth/lazyingart'||url.hash||url.username||url.password||url.searchParams.getAll('ticket').length!==1||[...url.searchParams.keys()].length!==1||url.searchParams.get('ticket')!==start.flow)throw new DiscussionError('invalid_flow')
  if(Capacitor.isNativePlatform())await Browser.open({url:url.href});else if(window.__BUNKO_DESKTOP__){const bridge=window.webkit?.messageHandlers.bunkoAuth;if(!bridge)throw new DiscussionError('update_required');void bridge.postMessage({url:url.href}).catch(()=>cancel())}else if(popup)popup.location.href=url.href
  const until=Date.now()+600000
  while(!controller.signal.aborted&&Date.now()<until){
   const result=await api<{linked?:boolean;pending?:boolean}>('/v1/lazyingart/complete',flow,controller.signal)
   if(result.linked){finished=true;return}
   await new Promise<void>(resolve=>{const done=()=>{clearTimeout(timer);controller.signal.removeEventListener('abort',done);resolve()},timer=setTimeout(done,2000);controller.signal.addEventListener('abort',done,{once:true})})
  }
  throw new DiscussionError('authorization_cancelled')
 })().finally(()=>{if(!finished)cancel();popup?.close();if(Capacitor.isNativePlatform())void Browser.close().catch(()=>{})})
 return {promise,cancel}
}
