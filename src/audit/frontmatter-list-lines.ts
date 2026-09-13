/** The raw indented lines belonging to one frontmatter key.
 *
 * Structural, not a YAML parse, for the reason `frontmatterFailure` gives:
 * this frontmatter is written by a model from untrusted material, and a parser
 * that throws on a stray character would take the whole audit down with it. The
 * block runs from the key to the next unindented line, and the body after the
 * closing `---` is never read - a key repeated inside a paragraph is prose. */
export const frontmatterListLines = (page: string, key: string): string[] => {
  const lines = page.split('\n')
  if (lines[0] !== '---') return []
  const end = lines.indexOf('---', 1)
  if (end === -1) return []
  const block: string[] = []
  let inside = false
  for (const line of lines.slice(1, end)) {
    if (line.startsWith(`${key}:`)) inside = true
    else if (/^\S/.test(line)) inside = false
    else if (inside) block.push(line)
  }
  return block
}
