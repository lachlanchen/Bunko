#!/usr/bin/env node
// Build additive display data for the whole cleared catalog. Existing chapter
// and metadata bytes stay untouched, so cached downloads and discussion IDs survive.
import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const [libraryArg, outputArg, ...selected] = process.argv.slice(2)
if (!libraryArg || !outputArg) throw new Error('Usage: node tools/build-sentence-maps.mjs LIBRARY OUTPUT [BOOK_ID...]')
const library = resolve(libraryArg), output = resolve(outputArg)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const { outputFiles } = await build({ entryPoints: [fileURLToPath(new URL('../src/lib/sentences.ts', import.meta.url))], bundle: true, format: 'esm', platform: 'node', write: false })
const { makeChapterSentenceMap, sentenceChapterHash } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString('base64')}`)
const index = JSON.parse(await readFile(join(library, 'reader-index.json'), 'utf8'))
if (selected.some(id => !index.books.some(book => book.id === id))) throw new Error('Unknown catalog ID')
const receipts = []
for (const book of index.books) {
  if (selected.length && !selected.includes(book.id)) continue
  if (!/^[a-z0-9-]+$/.test(book.id)) throw new Error('Invalid catalog ID')
  const source = join(library, 'books', book.id)
  const metaBytes = await readFile(join(source, 'meta.json'))
  if (sha(metaBytes) !== book.sha256) throw new Error(`Changed metadata for ${book.id}`)
  const meta = JSON.parse(metaBytes)
  const chapters = Object.create(null)
  let boundaries = 0, units = 0
  for (const row of meta.chapters) {
    if (!/^c[0-9]+(?:p[0-9]+)?(?:-[a-f0-9]+)?\.json$/.test(row.file)) throw new Error('Invalid chapter name')
    const bytes = await readFile(join(source, row.file))
    if (bytes.length !== row.bytes || row.sha256 && row.sha256 !== sha(bytes)) throw new Error(`Changed source ${book.id}/${row.file}`)
    const chapter = JSON.parse(bytes)
    const map = makeChapterSentenceMap(chapter.p)
    const entries = Object.values(map)
    if (!entries.length) continue
    chapters[row.file] = { chapterHash: sentenceChapterHash(chapter), units: map }
    units += entries.length
    boundaries += entries.reduce((sum, langs) => sum + Object.values(langs).reduce((count, cuts) => count + cuts.length, 0), 0)
  }
  const contents = JSON.stringify({ schema: 1, book: book.id, chapters }) + '\n'
  const dir = join(output, 'books', book.id)
  await mkdir(dir, { recursive: true })
  const dest = join(dir, 'sentences-v1.json'), temp = `${dest}.${process.pid}.tmp`
  await writeFile(temp, contents, { flag: 'wx' })
  await rename(temp, dest)
  receipts.push({ book: book.id, chaptersChecked: meta.chapters.length, chaptersWithBreaks: Object.keys(chapters).length, units, boundaries, bytes: Buffer.byteLength(contents), sha256: sha(contents) })
}
console.log(JSON.stringify({ catalogSha256: sha(await readFile(join(library, 'reader-index.json'))), books: receipts }, null, 2))
