/** The page with its YAML frontmatter block removed.
 *
 * Sibling of `pageClaimsText`, and the same finding one level up. That one
 * removes the body's `## Sources` section because a provenance list makes no
 * claim about the world; the frontmatter `sources:` list is the identical
 * problem and was left in, so the grader read 22 Medium URLs as prose. Measured
 * on 2026-08-03 grading `topics/claude-skills-ecosystem.md`: three of its four
 * reported claims - "17 official skills", "11 plugins for Cowork" and a
 * "135,000+ stars" count - appear nowhere in the page. They are readings of
 * article slugs inside frontmatter urls, one of which is literally
 * `anthropic-ships-17-skills-for-code-and-11-plugins-for-cowork`.
 *
 * Nothing in frontmatter is a claim the sources could support: `title`, `type`
 * and `updated` describe the page, and `sources:` describes where it came from.
 *
 * A block only counts when the file opens with `---`, so a horizontal rule
 * inside prose cannot be mistaken for one, and an unterminated block is left
 * untouched rather than swallowing the page. */
export const withoutFrontmatter = (page: string): string => {
  const lines = page.split('\n')
  if (lines[0] !== '---') return page
  const end = lines.slice(1).findIndex((line) => line === '---')
  return end === -1 ? page : lines.slice(end + 2).join('\n')
}
