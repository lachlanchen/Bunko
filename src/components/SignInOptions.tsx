import {useEffect,useState} from 'react'
import {api,type SignInProvider} from '../lib/discussions'
import type {UILanguage} from '../i18n'
import './signInOptions.css'

const labels={en:'Continue with', 'zh-Hans':'使用以下方式登录', 'zh-Hant':'使用以下方式登入', ja:'ログイン方法'}
const existing={en:'Already read with Bunko? Sign in as usual, then connect LazyingArt in Settings to keep your library and plan.', 'zh-Hans':'已有 Bunko 账号？请用原方式登录，再在设置中关联 LazyingArt，以保留书库和套餐。', 'zh-Hant':'已有 Bunko 帳號？請用原方式登入，再於設定中連結 LazyingArt，以保留書庫與方案。', ja:'Bunko をお使いの方は、いつもの方法でログインし、設定から LazyingArt を連携すると書庫とプランを保持できます。'}
const names={github:'GitHub',google:'Google',apple:'Apple',lazyingart:'LazyingArt'}
/** Server-qualified methods only; existing GitHub works during discovery outages. */
export function SignInOptions({ui,disabled,onSelect}:{ui:UILanguage;disabled?:boolean;onSelect:(provider:SignInProvider)=>void}) {
  const [methods,setMethods]=useState<SignInProvider[]>(['github'])
  useEffect(()=>{
    let active=true
    void api<{providers:SignInProvider[]}>('/v1/auth/methods',{}).then(r=>{
      if(active&&Array.isArray(r.providers))setMethods(['github','google','apple','lazyingart'].filter(p=>r.providers.includes(p as SignInProvider)) as SignInProvider[])
    }).catch(()=>{})
    return()=>{active=false}
  },[])
  return <><div className="sign-in-options" role="group" aria-label={labels[ui]}>{methods.map(p=><button key={p} type="button" disabled={disabled} onClick={()=>onSelect(p)}><span>{labels[ui]} {names[p]}</span></button>)}</div>{methods.length>1&&<p className="hint signin-existing">{existing[ui]}</p>}</>
}
