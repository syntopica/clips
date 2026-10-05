/** Where a page's frontmatter `sources:` entries sit, as the line range after
 * the key up to the next top-level key, or null when the frontmatter has no
 * such key. The same bounds `frontmatterListLines` reads. */
export const sourcesBlockRange = (
  lines: readonly string[],
): { start: number; end: number } | null => {
  if (lines[0] !== '---') return null
  const close = lines.indexOf('---', 1)
  if (close === -1) return null
  const key = lines.findIndex(
    (line, index) => index > 0 && index < close && line.startsWith('sources:'),
  )
  if (key === -1) return null
  let end = key + 1
  while (end < close && !/^\S/.test(lines[end] ?? '')) end += 1
  return { start: key + 1, end }
}
