/** A bare `YYYY-MM-DD` date declared under the given frontmatter key, or null
 * when the key is absent or is not a bare ISO date.
 *
 * Structural rather than parsed, like every other frontmatter read here - a
 * parser that throws on a stray character would take the whole audit down
 * with it. */
export const frontmatterDateField = (
  page: string,
  field: string,
): string | null => {
  const lines = page.split('\n')
  if (lines[0] !== '---') return null
  const end = lines.indexOf('---', 1)
  if (end === -1) return null
  const prefix = `${field}:`
  for (const line of lines.slice(1, end)) {
    if (!line.startsWith(prefix)) continue
    const value = /^\s*(\d{4}-\d{2}-\d{2})\s*$/u.exec(
      line.slice(prefix.length),
    )?.[1]
    if (value !== undefined) return value
  }
  return null
}
