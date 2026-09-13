/** Every markdown heading in a page's body, as written.
 *
 * Read structurally rather than by parsing the document, and only outside
 * fenced code blocks: a wiki page routinely quotes shell sessions and diffs
 * where a line can start with `#` and mean a comment, and counting those as
 * sections would make a page's shape depend on its examples. */
export const pageHeadings = (page: string): string[] => {
  const headings: string[] = []
  let fenced = false
  for (const line of page.split('\n')) {
    if (line.startsWith('```')) {
      fenced = !fenced
      continue
    }
    if (fenced) continue
    const heading = /^(#{1,6})\s+(\S.*)$/u.exec(line)
    if (heading !== null) headings.push(heading[2] ?? '')
  }
  return headings
}
