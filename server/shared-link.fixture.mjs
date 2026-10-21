import {DatabaseSync} from 'node:sqlite';
import {createProfileStore} from './shared-link-store.mjs';import {PROFILE_BINDING as B} from './lazyingart-profile.mjs';
export const config={...B,enabled:true,clientSecret:'s'.repeat(64),encryptionKey:'a'.repeat(64)},binding='b'.repeat(43),subject='la_'+'1'.repeat(32);
export function fixture(t){
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());const s={time:1900000000000,subject,active:true,flow:true,requests:[],hook:null};
 const accounts=new Map([['session',{owner:'reader',user:{id:7,login:'local-reader'},authenticatedAt:s.time}],['other-session',{owner:'other-reader',user:{id:8,login:'other-reader'},authenticatedAt:s.time}]]);
 const store={db,localSession:id=>accounts.get(id),active:owner=>s.active&&[...accounts.values()].some(a=>a.owner===owner),requireActive(owner){if(!this.active(owner))throw Object.assign(Error('inactive'),{code:'local_session_changed'})},flowActive:()=>s.flow};
 const discovery={issuer:B.issuer,contract_version:1,...Object.fromEntries(Object.entries({authorization_endpoint:'/account/authorize',token_endpoint:'/account/token',profile_endpoint:'/account/profile',introspection_endpoint:'/account/introspect',revocation_endpoint:'/account/revoke',account_endpoint:'/account'}).map(([k,v])=>[k,B.issuer+v])),response_types_supported:['code'],grant_types_supported:['authorization_code','refresh_token'],code_challenge_methods_supported:['S256'],token_endpoint_auth_methods_supported:['client_secret_post'],scopes_supported:['profile'],providers:{password:true,google:false,apple:false,github:false},adapter_contracts:['provider-select-v1'],authorization_extensions:{'provider-select-v1':{parameter:'authorization_contract',provider_parameter:'provider',prompt_parameter:'prompt',reuse_consent_parameter:'reuse_consent',scope:'profile',consent_ttl_seconds:2592000,providers:['lazyingart','google','apple','github'],prompt_values:['login','select_account','consent']}}};
 s.discovery=discovery;
 s.transport=async(method,url,body)=>{s.requests.push({url,body});const override=await s.hook?.(url,body);if(override!==undefined)return override;
  if(url.endsWith('lazyingart-account'))return discovery;
  if(url.endsWith('/token'))return{access_token:'t'.repeat(43),refresh_token:'r'.repeat(64),expires_in:600,scope:'profile',token_type:'Bearer'};
  if(url.endsWith('/introspect'))return{active:true,iss:B.issuer,sub:s.subject,client_id:B.clientId,aud:B.audience,scope:'profile',token_type:'Bearer',iat:s.time/1000,exp:s.time/1000+600,auth_time:s.time/1000,account:{subject:s.subject,display_name:'Fixture',account_status:'active',email_verified:false},verified_legacy_identities:[]};
  if(url.endsWith('/revoke'))return{success:true};throw Error('unexpected');
 };
 s.db=db;s.store=store;s.options={transport:s.transport,now:()=>s.time};s.link=createProfileStore(store,config,s.options);s.context={owner:'reader',sessionHash:'session',authenticatedAt:s.time,flow:'flow'};
 s.start=async(context=s.context)=>{const r=await s.link.begin({binding,...context}),u=new URL(r.authorizationUrl);return{url:u,callbackUrl:B.redirectUri+'?'+new URLSearchParams({state:u.searchParams.get('state'),iss:B.issuer,code:'c'.repeat(43)})}};
 s.finish=async(context)=>{const a=await s.start(context);return s.link.complete({callbackUrl:a.callbackUrl,binding})};return s;
}
