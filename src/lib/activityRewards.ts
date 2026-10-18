import {api,currentUser} from './discussions'

export function observeForegroundUse() {
 let sent=false
 const resume=()=>{if(document.visibilityState==='visible')sent=false}
 const use=()=>{
  const user=currentUser()
  if(sent||document.visibilityState!=='visible'||!user?.id||user.kind==='demo')return
  sent=true
  void api('/v1/lazyingart/activity',{kind:'foreground'}).catch(()=>{})
 }
 document.addEventListener('visibilitychange',resume)
 document.addEventListener('pointerdown',use,{passive:true})
 document.addEventListener('keydown',use)
 return ()=>{document.removeEventListener('visibilitychange',resume);document.removeEventListener('pointerdown',use);document.removeEventListener('keydown',use)}
}
