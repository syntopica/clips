import { headingLevel } from './heading-level.ts'

/** The line index just past the last non-blank line of the page's "Related"
 * or "See also" section, or null when it has none.
 *
 * The section runs from its heading to the next heading of the same or a
 * higher level, and the index skips trailing blank lines so a link inserted
 * there joins the list instead of trailing a gap. */
export const relatedSectionEnd = (lines: readonly string[]): number | null => {
  const start = lines.findIndex((line) =>
    /^#{2,6}\s+(?:related|see also)\b/i.test(line),
  )
  if (start === -1) return null
  const level = headingLevel(lines[start] ?? '')
  const next = lines.findIndex((line, index) => {
    const found = headingLevel(line)
    return index > start && found > 0 && found <= level
  })
  let end = next === -1 ? lines.length : next
  while (end > start + 1 && (lines[end - 1] ?? '').trim() === '') end -= 1
  return end
}
