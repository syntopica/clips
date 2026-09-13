/** A page's lines with fenced code blocks removed, as `[lineNumber, text]`.
 *
 * Both maths checks need this and neither may look inside a fence: a shell
 * snippet is full of `$VAR`, and a LaTeX example quoted in a code block is
 * documentation of the convention rather than a breach of it. The line number
 * is kept because a finding the reader cannot jump to costs more to act on than
 * it saves. */
export const linesOutsideCodeFences = (
  page: string,
): readonly (readonly [number, string])[] => {
  const kept: (readonly [number, string])[] = []
  let fenced = false
  for (const [index, line] of page.split('\n').entries()) {
    if (/^\s*(?:```|~~~)/.test(line)) {
      fenced = !fenced
      continue
    }
    if (!fenced) kept.push([index + 1, line])
  }
  return kept
}
