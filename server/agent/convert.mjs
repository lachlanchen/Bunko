import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { unzipSync } from 'fflate'
import { requireValue, hash } from './common.mjs'
import { downloadPublic, providerJSON } from './network.mjs'
import { unpackMMD } from './archive.mjs'
const exec = promisify(execFile)
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
export const formats = ['pdf', 'docx', 'md', 'mmd', 'txt', 'tex']
export function inspectFile(name, bytes) {
  const ext = name.split('.').pop().toLowerCase()
  requireValue(formats.includes(ext), 'Choose PDF, DOCX, Markdown, plain text or TeX.')
  requireValue(bytes.length > 0 && bytes.length <= 20_000_000, 'Files must be smaller than 20 MB.')
  if (ext === 'pdf') requireValue(bytes.subarray(0, 5).toString() === '%PDF-', 'This file is not a readable PDF.')
  if (ext === 'docx') {
    let count = 0, total = 0
    const files = unzipSync(bytes, { filter: file => {
      requireValue(++count <= 2000 && (total += file.originalSize) <= 50_000_000 && file.originalSize <= 10_000_000, 'The Word document is too large when unpacked.')
      requireValue(!file.name.startsWith('/') && !file.name.includes('\\') && !file.name.split('/').includes('..'), 'The Word document contains an unsafe path.')
      return file.name === 'word/document.xml'
    } })
    requireValue(files['word/document.xml'], 'Choose a .docx Word document.')
  } else if (ext !== 'pdf') {
    requireValue(bytes.length <= 2_000_000 && !bytes.includes(0), 'Text files must be UTF-8, without binary content, and smaller than 2 MB.')
    new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  }
  return ext
}
const encodedAssets = assets => assets.map(a => ({ path: a.path, data: a.data.toString('base64') }))
export async function convertDocument(doc, source, config, save, alive) {
  const directory = await mkdtemp(join(tmpdir(), 'bunko-document-'))
  try {
    let bytes = source
    if (!bytes && doc.source) bytes = await downloadPublic(doc.source)
    alive()
    const ext = inspectFile(doc.name, bytes)
    if (['txt', 'md', 'mmd'].includes(ext)) {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      return { mmd: ext === 'txt' ? text.replace(/([\\`*_{}[\]<>#$!|])/g, '\\$1') : text, assets: [] }
    }
    const path = join(directory, `source.${ext}`)
    await writeFile(path, bytes, { mode: 0o600 })
    if (ext !== 'pdf') {
      // Fixed arguments, no shell or filters; readers cannot include arbitrary files or URLs.
      const { stdout } = await exec(config.pandoc || 'pandoc', ['--sandbox', '--from', ext === 'tex' ? 'latex' : 'docx', '--to', 'markdown-raw_html-simple_tables-multiline_tables-grid_tables+pipe_tables', '--wrap=none', '--extract-media=media', '--fail-if-warnings', path, '+RTS', '-M256M', '-RTS'], { cwd: directory, timeout: 30_000, maxBuffer: 3_000_000 })
      let mmd = stdout
      const assets = []
      for (const [, ref] of stdout.matchAll(/!\[[^\]]*\]\(([^\s)]+)\)/g)) {
        requireValue(/^media\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(png|jpe?g|gif|webp)$/i.test(ref) && !ref.split('/').includes('..'), 'A figure could not be safely imported. Export this document to PDF and upload it instead.')
        const data = await readFile(join(directory, ref))
        requireValue(data.length <= 8_000_000, 'A figure exceeds the size limit.')
        const local = `figures/${hash(data).slice(0, 24)}.${ref.split('.').pop().toLowerCase()}`
        mmd = mmd.split(`](${ref})`).join(`](${local})`)
        if (!assets.some(a => a.path === local)) assets.push({ path: local, data })
      }
      return { mmd, assets: encodedAssets(assets) }
    }
    requireValue(config.mathpix?.appId && config.mathpix?.appKey, 'PDF conversion is not configured.', 503)
    const { stdout } = await exec(config.pdfinfo || 'pdfinfo', [path], { timeout: 10_000, maxBuffer: 100_000 })
    const pages = Number(stdout.match(/^Pages:\s+(\d+)/m)?.[1])
    requireValue(pages > 0 && pages <= (config.maxPages || 30) && !/^Encrypted:\s+yes/m.test(stdout), 'Upload an unencrypted PDF with at most 30 pages.')
    const headers = { app_id: config.mathpix.appId, app_key: config.mathpix.appKey }
    if (!doc.pdfId) {
      requireValue(!doc.submittedAt, 'The provider receipt is uncertain. Contact support before retrying.', 409)
      doc.pages = pages; doc.submittedAt = Date.now(); save(doc, true)
      const form = new FormData()
      form.append('file', new Blob([bytes], { type: 'application/pdf' }), 'document.pdf')
      form.append('options_json', JSON.stringify({ conversion_formats: { 'mmd.zip': true }, improve_mathpix: false }))
      const receipt = await providerJSON('https://api.mathpix.com/v3/pdf', { method: 'POST', headers, body: form })
      requireValue(typeof receipt.pdf_id === 'string' && /^[\w-]+$/.test(receipt.pdf_id), 'The conversion receipt is uncertain. Contact support.', 502)
      doc.pdfId = receipt.pdf_id; save(doc)
    }
    let complete = false
    for (let n = 0; n < 120; n++) {
      alive()
      const status = await providerJSON(`https://api.mathpix.com/v3/pdf/${doc.pdfId}`, { headers })
      if (status.status === 'completed') { complete = true; break }
      requireValue(!['error', 'failed'].includes(status.status), 'The conversion provider could not read the PDF.', 502)
      await pause(3000)
    }
    requireValue(complete, 'Conversion is taking longer than expected. Use Resume to continue without submitting again.', 502)
    for (let n = 0; n < 20; n++) {
      alive()
      const res = await fetch(`https://api.mathpix.com/v3/pdf/${doc.pdfId}.mmd.zip`, { headers, redirect: 'error', signal: AbortSignal.timeout(90_000) })
      if (res.ok && res.status !== 202) {
        let size = 0; const chunks = []
        for await (const chunk of res.body) { size += chunk.length; requireValue(size <= 30_000_000, 'Converted archive exceeds its size limit.'); chunks.push(chunk) }
        const { mmd, assets } = unpackMMD(Buffer.concat(chunks))
        return { mmd, assets: encodedAssets(assets) }
      }
      await res.body?.cancel()
      requireValue([202, 404, 409].includes(res.status), 'The converted figures could not be retrieved.', 502)
      await pause(3000)
    }
    throw new Error('Archive pending')
  } finally { await rm(directory, { recursive: true, force: true }) }
}
