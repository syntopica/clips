import { isSocialSourceHost } from './is-social-source-host.ts'
import type { SourceAuthorityTier } from './source-authority-tier.ts'

/** The authority tier of one `sources:` entry.
 *
 * A non-url is `primary`: every one of them is a path into this repository, and
 * what those paths hold is the thing itself - a clip of the article, a scraped
 * thread, the folded vault, a repository a `projects/` page describes. Whether
 * the path resolves is deliberately not asked. `resolveLocalSource` answers
 * that for the grader, which needs to open the file; a ranking only needs to
 * know what kind of source it is, and a primary source that has moved has not
 * become a web page.
 *
 * A url that will not parse is `web` rather than an error. This is frontmatter
 * a model wrote from untrusted material, so a malformed entry is expected, and
 * ranking it in the middle is the reading that changes the fewest outcomes. */
export const tierOfSource = (value: string): SourceAuthorityTier => {
  if (!/^https?:\/\//i.test(value)) return 'primary'
  const host = URL.parse(value)?.hostname
  return host !== undefined && isSocialSourceHost(host) ? 'social' : 'web'
}
