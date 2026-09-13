/** Does this page's frontmatter opt out of pipeline writes? `reviewed: true` is
 * the curated-page marker SCHEMA.md defines, and the boundary is opt-in on
 * purpose: inferring the same thing from git history fired on 86 of 90 pages
 * and carried no information, which is why that check was dropped.
 *
 * Structural, like frontmatterFailure, and for the same reason - a YAML parse
 * would reject legitimate pages over formatting. A page whose frontmatter is
 * missing or unterminated carries no marker, which is the safe answer here:
 * unreadable means unprotected, never protected.
 */
export const isReviewedPage = (text: string): boolean => {
  if (!text.startsWith('---\n')) return false
  const end = text.indexOf('\n---\n', 4)
  if (end === -1) return false
  return text
    .slice(4, end)
    .split('\n')
    .some((line) => line.trim() === 'reviewed: true')
}
