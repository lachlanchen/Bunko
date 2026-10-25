// Synthetic history and transport for the actual reading workspace components.
// Generated assets are installed into isolated Debug products only.
import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
const out = resolve(process.argv[2] || '.runtime/reading-workspace-fixture')
const names = [['魏','曹操','曹丕','荀彧','荀攸','郭嘉','程昱','贾诩','司马懿','张辽','许褚'],['蜀','刘备','刘禅','诸葛亮','庞统','法正','关羽','张飞','赵云','姜维','蒋琬'],['吴','孙权','孙策','周瑜','鲁肃','吕蒙','陆逊','张昭','张纮','甘宁','陆抗']]
const people = names.flatMap(([group, ...names]) => names.map((name, i) => ({ id: group + i, name, group, aliases: [], detail: `${group}方人物，演示分组与连续阅读。`, certainty: 'background', citations: [] })))
const relationships = names.flatMap(([group, ...names]) => names.slice(1).map((_, i) => ({ from: group + '0', to: group + (i + 1), label: '同一阵营', direction: 'mutual', certainty: 'background', citations: [] })))
const reference = { id: 'zizhi-tongjian', file: 'c0064p01.json', chapter: 63, paragraph: 0, scope: 'passage', language: 'wenyan', replyLanguage: 'zh-Hans' }
const guide = { key: 'workspace-root', visibility: 'private', revision: 'synthetic', reference, title: '资治通鉴', answer: '按魏、蜀、吴三方整理人物。可选择分组，再查看具体人物。', citations: [], knowledge: 'background', insufficient: false, people: people.slice(0, 20), relationships: relationships.filter(e => !e.from.startsWith('吴')), coverage: { chapter: 63, first: 0, last: 0, total: 3, partial: true, scope: 'passage', language: 'wenyan' } }
const messages = [{ id: 'root', kind: 'explore', state: 'completed', question: '整理三国人物关系', answer: guide.answer, papers: [], bookResponse: guide },
  { id: 'extended', parentId: 'root', kind: 'explore', state: 'completed', question: '补充吴国人物', answer: '已补充吴国人物，前面的魏、蜀人物仍然保留。', papers: [], bookResponse: { ...guide, key: 'workspace-extended', reference: { ...reference, paragraph: 2 }, people, relationships, events: [['官渡之战','公元200年'],['赤壁之战','公元208年'],['襄樊之战','公元219年']].map(([title,when],i)=>({id:'event'+i,title,when,detail:'三国史事背景。',certainty:'background',citations:[]})) } },
  { id: 'far', kind: 'explore', state: 'completed', question: '另一个章节的讨论', answer: '这是另一个分支。', papers: [], bookResponse: { ...guide, key: 'workspace-far', reference: { ...reference, chapter: 100, file: 'c0101.json' }, people: people.slice(0, 2), relationships: [] } }]
const mocks = {
  discussions: `const user={id:'workspace-fixture',login:'reader'};export const currentUser=()=>user,subscribeSession=()=>()=>{},restoreSession=async()=>{},requestId=()=> 'workspace-fixture-request';export class DiscussionError extends Error{};export const signIn=()=>({cancel(){},promise:Promise.resolve()}),api=async()=>({}),signInMethods=async()=>['github'];`,
  documentAgent: `export const initialModelPolicy={providers:['DeepSeek'],consentKey:'DeepSeek'};let messages=${JSON.stringify(messages)};export async function agentCall(action,input){if(action==='messages')return{messages,guide:null,modelPolicy:initialModelPolicy};if(action==='send'){window.__fixtureSends=(window.__fixtureSends||0)+1;const parent=messages.find(m=>m.id===input.parentId);const result={id:'followup',parentId:input.parentId,kind:'explore',state:'completed',question:input.text,answer:'这条追问接在所选分支上。',papers:[],bookResponse:{...parent.bookResponse,key:'workspace-followup',answer:'这条追问接在所选分支上。'}};messages=[...messages,result];return result}return{}}`,
  SignInOptions: 'export const SignInOptions=()=>null;', DemoAccount: 'export const DemoAccount=()=>null,DemoNotice=()=>null;',
  CloudPlans: 'export const CloudPlans=()=>null;', BookReferencePicker: 'export const BookReferencePicker=()=>null;',
  DocumentContent: `import React from 'react';export const DocumentContent=({text})=>React.createElement('p',null,text);`,
}
const chapters = Array.from({ length: 101 }, (_, i) => ({ n: i + 1, file: i === 63 ? reference.file : `c${String(i + 1).padStart(4, '0')}.json`, bytes: 100, paras: 3, title: { wenyan: `卷${i + 1}` } }))
const context = { meta: { schema: 1, id: reference.id, mode: 'single', primary: 'wenyan', langs: ['wenyan'], title: { wenyan: ['资治通鉴'] }, titleText: { wenyan: '资治通鉴' }, author: {}, bytes: 100, paras: 303, chapters }, chapter: 63, paragraph: 0, language: 'wenyan', returnTo: 'reader' }
const source = `import React from'react';import{createRoot}from'react-dom/client';import{BookCompanion}from'./src/components/BookCompanion';import './src/index.css';import './src/App.css';document.documentElement.dataset.theme=new URLSearchParams(location.search).get('theme')||'paper';localStorage.setItem('bunko-book-consent-v2:workspace-fixture:DeepSeek','yes');createRoot(document.getElementById('root')).render(<BookCompanion context={${JSON.stringify(context)}} ui="zh-Hans" onBack={()=>{}} onGeneral={()=>{}} onRead={()=>{}}/>);`
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, format: 'iife', jsx: 'automatic', outdir: out,
  plugins: [{ name: 'synthetic-workspace-adapters', setup(build) {
    build.onResolve({ filter: /\/(discussions|documentAgent|SignInOptions|DemoAccount|CloudPlans|BookReferencePicker|DocumentContent)$/ }, args => ({ path: args.path.split('/').at(-1), namespace: 'synthetic' }))
    build.onLoad({ filter: /.*/, namespace: 'synthetic' }, args => ({ contents: mocks[args.path], loader: 'js', resolveDir: process.cwd() }))
  } }] })
await mkdir(out, { recursive: false })
const files = { 'qa-workspace.html': '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bunko reading workspace fixture</title><link rel="stylesheet" href="qa-workspace.css"><div id="root"></div><script src="qa-workspace.js"></script>', 'qa-workspace.js': result.outputFiles.find(f => f.path.endsWith('.js')).text, 'qa-workspace.css': result.outputFiles.find(f => f.path.endsWith('.css')).text }
for (const [name, value] of Object.entries(files)) await writeFile(resolve(out, name), value)
await writeFile(resolve(out, 'fixture-manifest.json'), JSON.stringify(Object.fromEntries(Object.entries(files).map(([name, value]) => [name, createHash('sha256').update(value).digest('hex')])), null, 2))
console.log('Synthetic workspace fixture prepared; release resources unchanged.')
