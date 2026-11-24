import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { strToU8, zipSync } from 'fflate'
import { createKindleMail, KINDLE_EMAIL } from './kindle-mail.mjs'

function book(extra = {}) {
  const assets = Object.fromEntries(['META-INF/container.xml','EPUB/content.opf','EPUB/nav.xhtml','EPUB/reader.css','EPUB/chapter-1.xhtml']
    .map(name => [name, strToU8('Bunko')]))
  return Buffer.from(zipSync({ mimetype: [strToU8('application/epub+zip'), { level: 0 }], ...assets, ...extra })).toString('base64')
}
const input = (requestId = 'a'.repeat(43)) => ({ recipient: 'reader@kindle.com', filename: '三四郎.epub', attachment: book(), requestId })

function setup(send, now = Date.now) {
  const db = new DatabaseSync(':memory:')
  return { db, mail: createKindleMail({ db, now, key: randomBytes(32), send }) }
}

test('only the fixed sender, one Kindle address and bounded EPUB reach the transport', async () => {
  const sent = []
  const { db, mail } = setup(async message => { sent.push(message); return { accepted: message.envelope.to } })
  const request = input()
  assert.deepEqual(await mail.deliver('owner-a', request), { accepted: true })
  assert.deepEqual(await mail.deliver('owner-a', request), { accepted: true })
  assert.equal(sent.length, 1)
  assert.equal(sent[0].from.address, KINDLE_EMAIL)
  assert.deepEqual(sent[0].envelope, { from: KINDLE_EMAIL, to: [request.recipient] })
  assert.equal(sent[0].attachments[0].filename, request.filename)
  assert.equal(sent[0].attachments[0].content.toString('base64'), request.attachment)
  assert.equal(sent[0].attachments[0].contentType, 'application/epub+zip')
  assert.ok(!JSON.stringify(db.prepare('SELECT * FROM bunko_kindle_mail').all()).includes(request.recipient))
  await assert.rejects(mail.deliver('owner-a', { ...request, recipient: 'other@kindle.com' }), { code: 'kindle_request_conflict' })
  db.close()
})

test('recipient injection, unrecognized ZIP members and non-EPUBs are rejected before SMTP', async () => {
  const { db, mail } = setup(async () => { assert.fail('should not send') })
  for (const recipient of ['reader@gmail.com', 'kindle.com@example.org', 'a@kindle.com\r\nBcc: a@x.org', 'a@kindle.com,b@kindle.com']) {
    await assert.rejects(mail.deliver('owner-a', { ...input(), recipient }), { code: 'kindle_invalid_request' })
  }
  await assert.rejects(mail.deliver('owner-a', { ...input(), filename: '../evil.epub' }), { code: 'kindle_invalid_request' })
  await assert.rejects(mail.deliver('owner-a', { ...input(), attachment: input().attachment.slice(0, -8) }), { code: 'kindle_invalid_epub' })
  await assert.rejects(mail.deliver('owner-a', { ...input(), attachment: book({ '../secret': strToU8('x') }) }), { code: 'kindle_invalid_epub' })
  db.close()
})

test('concurrent and ambiguous retries do not send a second copy', async () => {
  let calls = 0, rejectSmtp
  const { db, mail } = setup(() => { calls++; return new Promise((_, reject) => { rejectSmtp = reject }) })
  const first = mail.deliver('owner-a', input())
  await assert.rejects(mail.deliver('owner-a', input()), { code: 'kindle_delivery_unknown' })
  rejectSmtp(new Error('timeout'))
  await assert.rejects(first, { code: 'kindle_delivery_unknown' })
  await assert.rejects(mail.deliver('owner-a', input()), { code: 'kindle_delivery_unknown' })
  assert.equal(calls, 1)
  db.close()
})

test('the recipient cap follows the address across accounts and expires after a day', async () => {
  let now = Date.now(), calls = 0
  const { db, mail } = setup(async message => { calls++; return { accepted: [message.to] } }, () => now)
  for (const owner of ['a', 'b', 'c', 'd']) await mail.deliver(owner, input())
  await assert.rejects(mail.deliver('e', input()), { code: 'kindle_rate_limited' })
  now += 86_400_001
  await mail.deliver('e', input())
  assert.equal(calls, 5)
  db.close()
})
