/** Whether a page declares `verification: exempt` in its frontmatter.
 *
 * The wiki is half source-derived and half written from the owner's own
 * knowledge, and the second half has no evidence to grade against: an access
 * map, a fiscal close, a page describing a repository that maintains itself
 * elsewhere. Grading them is not merely expensive, it is undefined - there is
 * nothing on disk for a claim to be true or false against.
 *
 * Before this marker they were silently skipped, and the silence looked like
 * coverage. Now the exemption is declared on the page and the audit reports
 * every page that needs one and does not have it, so what nothing verifies is
 * enumerable rather than assumed.
 *
 * Structural like every other frontmatter read here, and for the reason
 * `frontmatterFailure` gives: a parser that throws on a stray character would
 * take the whole audit down with it. */
export const pageVerificationExempt = (page: string): boolean => {
  const lines = page.split('\n')
  if (lines[0] !== '---') return false
  const end = lines.indexOf('---', 1)
  if (end === -1) return false
  return lines
    .slice(1, end)
    .some((line) => /^verification:\s*exempt\s*$/.test(line))
}
