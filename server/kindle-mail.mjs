import { createHash, createHmac } from 'node:crypto'
import { unzipSync } from 'fflate'
import nodemailer from 'nodemailer'

export const KINDLE_EMAIL = 'bunko@lazying.art'
export const KINDLE_BODY_LIMIT = 16 * 1024 * 1024 + 2048
const MAX_ATTACHMENT = 12 * 1024 * 1024
const epubType = 'application/epub+zip'
const DAY = 86_400_000
const supported = /^(?:mimetype|META-INF\/container\.xml|EPUB\/(?:content\.opf|nav\.xhtml|reader\.css|chapter-[1-9]\d*\.xhtml|image-[1-9]\d*\.(?:png|jpeg|webp)))$/
const fail = (status, code) => { throw Object.assign(new Error(code), { status, code }) }

export function wecomKindleTransport(password) {
  if (typeof password !== 'string' || !password || password.length > 512 || /[\r\n\0]/.test(password)) throw new Error('Invalid Kindle mailbox credential')
  const transport = nodemailer.createTransport({
    host: 'smtp.exmail.qq.com', port: 465, secure: true,
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    auth: { user: KINDLE_EMAIL, pass: password },
    connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true, maxRecipients: 1, logger: false,
  })
  return message => transport.sendMail(message)
}

function attachmentFrom(value) {
  if (typeof value !== 'string' || value.length > Math.ceil(MAX_ATTACHMENT / 3) * 4) fail(413, 'kindle_epub_too_large')
  if (value.length < 60 || value.length % 4) fail(400, 'kindle_invalid_epub')
  const buffer = Buffer.from(value, 'base64')
  if (buffer.length > MAX_ATTACHMENT) fail(413, 'kindle_epub_too_large')
  if (buffer.length < 58 || buffer.toString('base64') !== value) fail(400, 'kindle_invalid_epub')
  // The first header and the tiny stored mimetype are checked without inflating the book.
  if (buffer.readUInt32LE(0) !== 0x04034b50 || buffer.readUInt16LE(8) !== 0 ||
      buffer.readUInt16LE(26) !== 8 || buffer.readUInt16LE(28) !== 0 ||
      buffer.toString('ascii', 30, 58) !== 'mimetype'+epubType) fail(400, 'kindle_invalid_epub')
  try {
    const seen = new Set()
    let originalBytes = 0
    unzipSync(buffer, { filter: file => {
      if (!supported.test(file.name) || seen.has(file.name) || seen.size >= 5000 ||
          ![0, 8].includes(file.compression) || file.size > MAX_ATTACHMENT || file.originalSize > 32 * 1024 * 1024) throw new Error('Invalid zip members')
      seen.add(file.name)
      originalBytes += file.originalSize
      if (originalBytes > 160 * 1024 * 1024) throw new Error('Invalid zip size')
      return false
    } })
    for (const part of ['mimetype','META-INF/container.xml','EPUB/content.opf','EPUB/nav.xhtml','EPUB/reader.css','EPUB/chapter-1.xhtml']) {
      if (!seen.has(part)) throw new Error('Incomplete EPUB')
    }
  } catch { fail(400, 'kindle_invalid_epub') }
  return buffer
}

export function createKindleMail({ db, now, key, send }) {
  if (!send) return { enabled: false }
  db.exec(`CREATE TABLE IF NOT EXISTS bunko_kindle_mail (
    owner TEXT NOT NULL, request_id TEXT NOT NULL, recipient_key TEXT NOT NULL,
    fingerprint TEXT NOT NULL, status TEXT NOT NULL, created INTEGER NOT NULL,
    PRIMARY KEY(owner, request_id)
  ); CREATE INDEX IF NOT EXISTS bunko_kindle_recent ON bunko_kindle_mail(created);`)
  const lookup = db.prepare('SELECT fingerprint,status FROM bunko_kindle_mail WHERE owner=? AND request_id=?')
  const cleanup = db.prepare('DELETE FROM bunko_kindle_mail WHERE created <= ?')
  const quota = db.prepare(`SELECT count(*) AS global, coalesce(sum(owner=?),0) AS account,
    coalesce(sum(recipient_key=?),0) AS recipient FROM bunko_kindle_mail WHERE created > ?`)
  const reserve = db.prepare('INSERT INTO bunko_kindle_mail VALUES (?, ?, ?, ?, ?, ?)')
  const accept = db.prepare("UPDATE bunko_kindle_mail SET status='accepted' WHERE owner=? AND request_id=?")
  return {
    enabled: true,
    prune() { cleanup.run(now()-3*DAY) },
    async deliver(owner, input) {
      const { recipient, filename, attachment, requestId } = input
      if (typeof recipient !== 'string' || !/^[a-z0-9][a-z0-9._+-]{0,63}@kindle\.com$/.test(recipient) ||
          typeof filename !== 'string' || filename.length > 204 || !/^[\p{L}\p{N}\p{M} _().-]+\.epub$/u.test(filename) ||
          typeof requestId !== 'string' || !/^[\w-]{43}$/.test(requestId)) fail(400, 'kindle_invalid_request')
      const content = attachmentFrom(attachment)
      const recipientKey = createHmac('sha256', key).update('bunko-kindle:'+recipient).digest('hex')
      const fingerprint = createHmac('sha256', key).update(recipientKey).update('\0').update(filename).update('\0').update(content).digest('hex')
      const at = now()
      db.exec('BEGIN IMMEDIATE')
      try {
        cleanup.run(at-3*DAY)
        const old = lookup.get(owner, requestId)
        if (old) {
          if (old.fingerprint !== fingerprint) fail(409, 'kindle_request_conflict')
          if (old.status !== 'accepted') fail(409, 'kindle_delivery_unknown')
          db.exec('COMMIT')
          return { accepted: true }
        }
        const usage = quota.get(owner, recipientKey, at-DAY)
        if (usage.account >= 4 || usage.recipient >= 4 || usage.global >= 50) fail(429, 'kindle_rate_limited')
        // Commit before SMTP. A transport timeout or crash remains an ambiguous
        // attempt and cannot become a second delivery on retry.
        reserve.run(owner, requestId, recipientKey, fingerprint, 'reserved', at)
        db.exec('COMMIT')
      } catch (error) { db.exec('ROLLBACK'); throw error }
      const messageId = createHash('sha256').update(owner).update(':').update(requestId).digest('hex')
      let result
      try {
        result = await send({
          from: { name: 'Bunko', address: KINDLE_EMAIL }, to: recipient, maxRecipients: 1,
          envelope: { from: KINDLE_EMAIL, to: [recipient] }, messageId: `<kindle-${messageId}@lazying.art>`,
          subject: 'Bunko EPUB', text: 'Your Bunko EPUB is attached.',
          attachments: [{ filename, contentType: epubType, content }],
        })
      } catch { fail(503, 'kindle_delivery_unknown') }
      if (result?.accepted?.length !== 1 || result.accepted[0]?.toLowerCase() !== recipient) fail(503, 'kindle_delivery_unknown')
      accept.run(owner, requestId)
      return { accepted: true }
    },
  }
}
