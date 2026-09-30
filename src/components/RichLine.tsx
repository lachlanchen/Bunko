import { htmlLanguage, languageDirection, unitLine } from '../lib/languages'
import katex from 'katex'
import type { Unit, LangCode } from '../types'
import { Line } from './Line'

const TEX_MACROS = {
  '\\expect': '\\langle #1 \\rangle',
  '\\bra': '\\langle #1 |',
  '\\ket': '| #1 \\rangle',
  '\\braket': '\\langle #1 | #2 \\rangle',
  '\\mbox': '\\text',
}

/** Render author-supplied TeX locally; no script or remote MathJax dependency. */
export function RichLine({ unit, lang, ruby, grammar }: {
  unit: Unit; lang: LangCode; ruby: boolean; grammar: boolean;
}) {
  const rich = unit.rich?.[lang]
  if (!rich) return <Line line={unitLine(unit, lang)} lang={lang} ruby={ruby} grammar={grammar} />
  return <span className="rich-line" lang={htmlLanguage(lang)} dir={languageDirection(lang)}>{rich.map((part, index) => {
    if (!part.math) return <span key={index}>{part.text}</span>
    try {
      const markup = katex.renderToString(part.math, { displayMode: !!part.display, throwOnError: false, trust: false, strict: 'ignore', output: 'htmlAndMathml', macros: TEX_MACROS })
      return <span key={index} className={part.display ? 'math-display' : 'math-inline'} dangerouslySetInnerHTML={{ __html: markup }} />
    } catch {
      return <code key={index} className="math-error">{part.math}</code>
    }
  })}</span>
}
