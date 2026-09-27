import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { createDocumentAgent } from './agent/service.mjs'
import { inspectFile } from './agent/convert.mjs'
import { isPublicIP } from './agent/network.mjs'
const reader = { id: 7 }, other = { id: 9 }
const requestId = 'request_fixture_1234567890'
test('exact arXiv identifiers bypass broad research search', async () => {
  const { directPaper, respond } = await import('./agent/discovery.mjs')
  assert.equal(directPaper('Find Attention Is All You Need, arXiv 1706.03762v7').pdfUrl, 'https://arxiv.org/pdf/1706.03762v7')
  assert.equal(directPaper('Find paper 1512.03385').pdfUrl, 'https://arxiv.org/pdf/1512.03385')
  assert.equal(directPaper('Reading size 1820.00001'), null)
  let downloaded
  const answer = await respond({ text: 'Find arXiv 1706.03762', messages: [] }, {}, () => {}, {
    download: async url => { downloaded = url; return Buffer.from('%PDF-1.4\nPaper') },
    search: async () => { throw new Error('Exact identifiers must not become search terms') },
  })
  assert.equal(downloaded, 'https://arxiv.org/pdf/1706.03762')
  assert.equal(answer.papers.length, 1)
})
function setup(t, deps = {}) {
  const db = new DatabaseSync(':memory:')
  const agent = createDocumentAgent({ db, seal: JSON.stringify, unseal: JSON.parse, config: { enabled: true }, convert: async (_d, bytes) => ({ mmd: bytes.toString(), assets: [] }), discover: async () => ({ text: 'Found an open paper.', papers: [] }), ...deps })
  t.after(() => { agent.close(); db.close() })
  return { db, agent, call: (path, input = {}, who = reader) => agent.handle(path, input, who) }
}
test('private imports, idempotency, ownership, durable history and deletion', async t => {
  const { agent, call, db } = setup(t)
  const input = { name: 'notes.md', data: Buffer.from('# Motion\n\n$E=mc^2$').toString('base64'), requestId }
  const doc = await call('upload', input)
  assert.equal((await call('upload', input)).id, doc.id)
  await assert.rejects(call('upload', { ...input, name: 'different.md' }), /already used/)
  assert.equal((await call('state', {}, other)).documents.length, 0)
  await assert.rejects(call('document', { documentId: doc.id }, other), /not found/)
  await agent.tick()
  assert.equal((await call('document', { documentId: doc.id })).state, 'ready')
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM agent_sources').get().n, 0)
  const answer = await call('send', { text: 'Find an open physics paper', requestId: 'message_request_1234567890' })
  assert.equal(answer.state, 'completed')
  assert.deepEqual(await call('send', { text: 'Find an open physics paper', requestId: 'message_request_1234567890' }), answer)
  assert.equal((await call('messages')).messages.length, 1)
  await assert.rejects(call('report', { messageId: answer.id, reason: 'Incorrect claim' }, other))
  await call('report', { messageId: answer.id, reason: 'Incorrect claim' })
  await call('delete', { documentId: doc.id, confirm: 'DELETE' })
  await assert.rejects(call('document', { documentId: doc.id }))
  await call('clear', { confirm: 'DELETE' })
  assert.equal((await call('messages')).messages.length, 0)
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM agent_reports').get().n, 0)
})
test('removing a converting document prevents late results restoring it', async t => {
  let release, started
  const ready = new Promise(resolve => { started = resolve })
  const pending = new Promise(resolve => { release = resolve })
  const { agent, call, db } = setup(t, { convert: async () => { started(); await pending; return { mmd: 'late result', assets: [] } } })
  const doc = await call('upload', { name: 'notes.md', data: Buffer.from('private').toString('base64'), requestId })
  const job = agent.tick(); await ready
  await call('delete', { documentId: doc.id, confirm: 'DELETE' })
  release(); await job
  assert.equal((await call('state')).documents.length, 0)
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM agent_sources').get().n, 0)
})
test('daily import limits survive duplicate requests; formats and private network ranges rejected', async t => {
  const { call } = setup(t)
  for (let i = 0; i < 20; i++) await call('upload', { name: 'n.txt', data: 'dGVzdA==', requestId: `request_unique_number_${i}` })
  await assert.rejects(call('upload', { name: 'n.txt', data: 'dGVzdA==', requestId: 'request_unique_number_21' }), /allowance/)
  assert.throws(() => inspectFile('bad.pdf', Buffer.from('not a PDF')))
  assert.throws(() => inspectFile('bad.exe', Buffer.from('script')))
  for (const ip of ['127.0.0.1', '::1', '::ffff:127.0.0.1', '10.1.2.3', '169.254.169.254', '192.168.1.2']) assert.equal(isPublicIP(ip), false)
  assert.equal(isPublicIP('8.8.8.8'), true)
})
test('deleting conversations during an answer prevents recreation', async t => {
  let release, started
  const ready = new Promise(resolve => { started = resolve })
  const pending = new Promise(resolve => { release = resolve })
  const { call } = setup(t, { discover: async () => { started(); await pending; return { text: 'late answer', papers: [] } } })
  const answer = call('send', { text: 'Find papers', requestId })
  await ready; await call('clear', { confirm: 'DELETE' }); release(); await answer
  assert.equal((await call('messages')).messages.length, 0)
})

test('paper discovery coalesces calls, caches success, and falls back during provider failure', async () => {
  const { createPaperSearch } = await import('./agent/discovery.mjs')
  let calls = 0, arxivCalls = 0
  const search = createPaperSearch({
    download: async url => {
      calls++
      if (url.includes('openalex.org')) throw new Error('429')
      return Buffer.from(JSON.stringify({ resultList: { result: [
        { title: 'Open paper', isOpenAccess: 'Y', pmcid: 'PMC123', fullTextUrlList: { fullTextUrl: [{ documentStyle: 'pdf', availabilityCode: 'OA', url: 'https://example.org/open.pdf' }] } },
        { title: 'Closed paper', isOpenAccess: 'N', fullTextUrlList: { fullTextUrl: [{ documentStyle: 'pdf', availabilityCode: 'OA', url: 'https://example.org/closed.pdf' }] } },
      ] } }))
    }, arxiv: async () => { arxivCalls++; throw new Error('406') },
  })
  const [a,b] = await Promise.all([search('quantum'), search('quantum')])
  assert.deepEqual(a,b); assert.equal(a.length,1); assert.equal(calls,2); assert.equal(arxivCalls,1)
  assert.deepEqual(await search('quantum'),a); assert.equal(calls,2)
  await search('another topic'); assert.equal(calls,3); assert.equal(arxivCalls,1)
})
