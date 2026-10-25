import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createReadingTools } from './agent/reading-tools.mjs'
import { lookupMapPlaces, checkMapRequest, groundMap, historicalRegion } from './agent/map-grounding.mjs'
import { runStructuredReading } from './agent/structured-task.mjs'
import han from './agent/han-regions.json' with { type: 'json' }

const context = { reference: { id: 'zizhi-tongjian' }, coverage: { partial: true, scope: 'passage' }, passages: [{ id: 'P1', text: '汉献帝初平二年，青州、兖州、荆州。' }] }
const query = '画一张地图，当时青州 兖州 荆州 其他所有州，不同的颜色标注一下'
const entry = region => ({ id: region.id, locationId: region.id, name: region.name, detail: '州域参考', aliases: [], certainty: 'background', citations: [] })
const complete = { answer: '初平二年（191年）的州名，使用东汉约140年参考州域。', mapYear: 191, knowledge: 'background', citations: [], places: han.regions.map(entry), routes: [] }

test('historical provinces resolve as thirteen dated regions rather than namesake modern cities', () => {
  const results = lookupMapPlaces(han.regions.map(r => r.name), 191)
  assert.equal(results.length, 13)
  assert.ok(results.every(r => r.candidates.length === 1 && r.candidates[0].kind === 'region' && r.candidates[0].referenceYear === 140))
  assert.equal(new Set(results.map(r => r.candidates[0].id)).size, 13)
  assert.equal(historicalRegion(['钦州'], 191), null)
  assert.equal(historicalRegion(['荆州'], 800), null)
  assert.equal(historicalRegion(['荆州'], 191, 'han140-qing'), null)
  assert.ok(lookupMapPlaces(['London'])[0].candidates.length > 1)
  assert.deepEqual(lookupMapPlaces(['The Kingdom of Invisible Clouds'])[0].candidates, [])
  assert.equal(lookupMapPlaces(['长安'], 191)[0].candidates[0].id, '1159151363')
  assert.ok(lookupMapPlaces(['长安'], 191)[0].candidates[0].note.includes('not an ancient wall'))
})

test('map acceptance checks missing requested regions, year and false location identifiers', () => {
  assert.deepEqual(checkMapRequest(complete, query, context, 'places'), [])
  assert.equal(checkMapRequest({ ...complete, places: complete.places.slice(0, 3) }, query, context, 'places').length, 10)
  assert.match(checkMapRequest({ answer: 'Here is your map.', places: [] }, query, context, 'places')[0], /no places/)
  assert.match(checkMapRequest({ ...complete, answer: '州图', mapYear: undefined }, query, context, 'places')[0], /period/)
  assert.match(checkMapRequest({ ...complete, places: [{ ...complete.places[0], locationId: 'invented-id' }] }, '扬州', context, 'places').join(' '), /Invalid locationId/)
  assert.deepEqual(checkMapRequest({ answer: 'Rome', mapYear: 100, places: [{ name: 'Rome' }] }, 'All Roman provinces on a map', { reference: { id: 'rome' } }, 'places'), [])
})

test('saved maps acquire a dated region layer without overwriting questions, answers or stored facts', () => {
  const old = { ...complete, mapYear: undefined, key: 'saved', places: complete.places.map(({ locationId: _, ...p }) => p) }
  const original = JSON.stringify(old), result = groundMap(old)
  assert.equal(result.mapYear, 191); assert.equal(result.places.length, 13)
  assert.equal(result.answer, old.answer); assert.equal(result.routes, old.routes)
  assert.equal(JSON.stringify(old), original)
  assert.ok(result.places.every(p => p.locationId.startsWith('han140-')))
  assert.equal(groundMap({ ...old, answer: '唐朝荆州，公元800年。' }).mapYear, undefined)
})

test('a real tool transcript resolves all regions and then delivers a complete map proposal', async () => {
  let calls = 0, usage
  const result = await runStructuredReading({ messages: [{ role: 'user', content: query }], kind: 'explore', focus: 'places', tools: createReadingTools(context), timeoutMs: 1000, maxTokens: 2000,
    onUsage: value => { usage = value }, complete: async (_url, options) => {
      const body = JSON.parse(options.body); calls++
      if (calls === 1) return { choices: [{ finish_reason: 'tool_calls', message: { tool_calls: [{ id: 'layers', type: 'function', function: { name: 'list_map_layers', arguments: '{}' } }] } }] }
      if (calls === 2) {
        const result = JSON.parse(body.messages.at(-1).content)
        assert.equal(JSON.parse(result.report).layers[0].regions.length, 13)
        return { choices: [{ finish_reason: 'tool_calls', message: { tool_calls: [{ id: 'places', type: 'function', function: { name: 'lookup_places', arguments: JSON.stringify({ names: han.regions.map(r => r.name), year: 191 }) } }] } }] }
      }
      assert.equal(body.messages.filter(m => m.role === 'tool').length, 2)
      assert.equal(JSON.parse(JSON.parse(body.messages.at(-1).content).report).matches.length, 13)
      return { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(complete) } }] }
    } })
  assert.equal(calls, 3); assert.equal(usage.toolCalls, 2); assert.equal(usage.steps, 3)
  assert.equal(result.places.length, 13)
})

test('source tool stays inside selected passages and rejects ambient URLs/account or shell capabilities', async () => {
  const tools = createReadingTools(context)
  const source = tools.find(t => t.name === 'search_passages')
  assert.equal(JSON.parse((await source.execute({ terms: ['兖州'] })).report).passages[0].id, 'P1')
  assert.deepEqual(JSON.parse((await source.execute({ terms: ['later secret'] })).report).passages, [])
  let calls = 0
  await assert.rejects(runStructuredReading({ messages: [{ role: 'user', content: query }], kind: 'explore', tools, timeoutMs: 1000, maxTokens: 2000,
    complete: async () => { calls++; return { choices: [{ finish_reason: 'tool_calls', message: { tool_calls: [{ id: 'danger', type: 'function', function: { name: 'exec', arguments: '{"cmd":"env"}' } }] } }] } } }), /could not finish/)
  assert.equal(calls, 1)
})

test('tool loop has a final synthesis step, a finite call budget and cancellation', async () => {
  let calls = 0
  const result = await runStructuredReading({ messages: [{ role: 'user', content: query }], kind: 'explore', focus: 'places', tools: createReadingTools(context), timeoutMs: 1000, maxTokens: 2000,
    complete: async (_url, options) => {
      const body = JSON.parse(options.body); calls++
      if (calls === 4) { assert.equal(body.tool_choice, 'none'); return { choices: [{ message: { content: JSON.stringify(complete) } }] } }
      return { choices: [{ finish_reason: 'tool_calls', message: { tool_calls: [{ id: `layers${calls}`, type: 'function', function: { name: 'list_map_layers', arguments: '{}' } }] } }] }
    } })
  assert.equal(calls, 4); assert.equal(result.places.length, 13)
})
