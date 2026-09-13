/** Null when the page opens with frontmatter carrying the fields SCHEMA.md
 * requires - title, type, updated, summary, sources (SPEC:366). A structural
 * check, not a YAML parse: the wiki's own prettier/lint pass owns formatting,
 * and a false rejection here would block a legitimate page over a formatting
 * nuance.
 *
 * `summary:` joined the set on 2026-08-03, when `index.md` became generated
 * from it. A page without one still reaches the map, bare, and the generator
 * only names it on stderr - which nothing in an unattended ingest reads. The
 * field is load-bearing now, so it is checked rather than hoped for. */
export const frontmatterFailure = (text: string): string | null => {
  if (!text.startsWith('---\n')) return 'missing frontmatter'
  const end = text.indexOf('\n---\n', 4)
  if (end === -1) return 'unterminated frontmatter'
  const frontmatter = text.slice(4, end)
  for (const field of ['title:', 'type:', 'updated:', 'summary:', 'sources:']) {
    if (!frontmatter.split('\n').some((line) => line.startsWith(field)))
      return `frontmatter is missing ${field.slice(0, -1)}`
  }
  return null
}
