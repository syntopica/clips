import { INLINE_MATHS_PATTERN } from './inline-maths-pattern.ts'
import { linesOutsideCodeFences } from './lines-outside-code-fences.ts'
import { withoutInlineCode } from './without-inline-code.ts'

/** Every line of a page that writes maths inline, as `line N: <the line>`.
 *
 * Lines inside a `$$` block are skipped rather than matched: block maths is the
 * allowed form, and its body is exactly the LaTeX the inline pattern looks for.
 * The block toggles on any line carrying `$$`, which covers both the delimiter
 * on its own line and the whole formula written on one. */
export const pageInlineMaths = (page: string): string[] => {
  const offences: string[] = []
  let inBlock = false
  for (const [number, raw] of linesOutsideCodeFences(page)) {
    const line = withoutInlineCode(raw)
    const delimiters = (line.match(/\$\$/g) ?? []).length
    if (delimiters > 0) {
      if (delimiters % 2 === 1) inBlock = !inBlock
      continue
    }
    if (inBlock) continue
    if (INLINE_MATHS_PATTERN.test(line))
      offences.push(`line ${String(number)}: ${raw.trim()}`)
  }
  return offences
}
