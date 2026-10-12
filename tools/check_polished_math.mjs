import katex from 'katex'
import fs from 'node:fs'

// Keep compatible with RichLine: this gate fails rather than rendering red TeX.
const macros = {
  '\\expect': '\\langle #1 \\rangle', '\\bra': '\\langle #1 |',
  '\\ket': '| #1 \\rangle', '\\braket': '\\langle #1 | #2 \\rangle',
  '\\mbox': '\\text',
}
const rows = JSON.parse(fs.readFileSync(0, 'utf8'))
const issues = []
for (const row of rows) {
  try {
    katex.renderToString(row.math, { macros, displayMode: !!row.display,
      throwOnError: true, strict: 'ignore', trust: false })
  } catch (error) {
    issues.push({ location: row.location, error: String(error), math: row.math })
  }
}
process.stdout.write(JSON.stringify({ checked: rows.length, issues }))
process.exitCode = issues.length ? 1 : 0
