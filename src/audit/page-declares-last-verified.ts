/** Whether a page's frontmatter carries a `last_verified:` line at all,
 * whatever its value.
 *
 * Separate from reading the date because the two answers mean opposite things.
 * A page with no line has made no claim, and the audit has nothing to age out.
 * A page whose line is unreadable has made a claim the check cannot judge, and
 * silently treating it as absent would let one typo switch the check off on the
 * page that carries it - the failure `pageUpdatedDate` already refuses for
 * `updated:`. */
export const pageDeclaresLastVerified = (page: string): boolean => {
  const lines = page.split('\n')
  if (lines[0] !== '---') return false
  const end = lines.indexOf('---', 1)
  if (end === -1) return false
  return lines.slice(1, end).some((line) => line.startsWith('last_verified:'))
}
