// A synthetic component fixture for the isolated Debug WebKit harness.
// These assets are copied into the Debug product only, never a release bundle.
import { build } from 'esbuild'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

const out = resolve(process.argv[2] || '.runtime/reading-map-fixture')
const han = JSON.parse(await readFile('server/agent/han-regions.json', 'utf8'))
const places = han.regions.map(r => ({ id: r.id, name: r.name, locationId: r.id, aliases: r.names,
  detail: '东汉州域参考。', citations: [], certainty: 'background' }))
const cities = [['luoyang', '洛阳', '1159147063'], ['changan', '长安', '1159151363'], ['xiangyang', '襄阳', '1159148459']]
  .map(([id, name, locationId]) => ({ id, name, locationId, aliases: [], detail: '城市大致方位。', citations: [], certainty: 'background' }))
const guide = { key: 'han-map-fixture', revision: 'fixture', answer: '东汉十三州', citations: [], knowledge: 'background', insufficient: false, mapYear: 191, places, routes: [],
  reference: { id: 'zizhi-tongjian', chapter: 63, paragraph: 5, file: 'c0064p01.json', language: 'wenyan', replyLanguage: 'zh-Hans', scope: 'passage' },
  coverage: { chapter: 63, first: 0, last: 5, total: 6, partial: false, scope: 'passage', language: 'wenyan' } }
const source = `import React,{useState}from'react';import{createRoot}from'react-dom/client';import{BookGuide}from'./src/components/BookGuide';import './src/index.css';import './src/App.css';
const initial=${JSON.stringify(guide)},cities=${JSON.stringify(cities)};
document.documentElement.dataset.theme='paper';
function Preview(){const[extended,setExtended]=useState(false);const g=extended?{...initial,key:'han-map-extended',places:[...initial.places,...cities]}:initial;return <main style={{maxWidth:1000,margin:'auto',padding:16}}><h1>资治通鉴 · 汉末州域</h1><button data-map-extend onClick={()=>setExtended(!extended)}>{extended?'十三州':'补充洛阳、长安、襄阳'}</button><BookGuide guide={g} tab="places" ui="zh-Hans" onRead={()=>{}}/></main>};createRoot(document.getElementById('root')).render(<Preview/>);`
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, format: 'iife', jsx: 'automatic', outdir: out })
await mkdir(out, { recursive: false })
const files = { 'qa-map.html': '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bunko map fixture</title><link rel="stylesheet" href="qa-map.css"><div id="root"></div><script src="qa-map.js"></script>',
  'qa-map.js': result.outputFiles.find(f => f.path.endsWith('.js')).text,
  'qa-map.css': result.outputFiles.find(f => f.path.endsWith('.css')).text }
for (const [name, value] of Object.entries(files)) await writeFile(resolve(out, name), value)
await writeFile(resolve(out, 'fixture-manifest.json'), JSON.stringify(Object.fromEntries(Object.entries(files).map(([name, value]) => [name, createHash('sha256').update(value).digest('hex')])), null, 2))
console.log('Synthetic map fixture prepared; release resources unchanged.')
