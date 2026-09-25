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
export function RichLine({ unit, lang, ruby, grammar, onToken }: {
  unit: Unit; lang: LangCode; ruby: boolean; grammar: boolean;
  onToken: (word: string, reading: string) => void
}) {
  const rich = unit.rich?.[lang]
  if (!rich) return <Line line={unit[lang]} ruby={ruby} grammar={grammar} onToken={onToken} />
  return <span className="rich-line">{rich.map((part, index) => {
    if (!part.math) return <span key={index}>{part.text}</span>
    try {
      const markup = katex.renderToString(part.math, { displayMode: !!part.display, throwOnError: false, trust: false, strict: 'ignore', output: 'htmlAndMathml', macros: TEX_MACROS })
      return <span key={index} className={part.display ? 'math-display' : 'math-inline'} dangerouslySetInnerHTML={{ __html: markup }} />
    } catch {
      return <code key={index} className="math-error">{part.math}</code>
    }
  })}</span>
}
