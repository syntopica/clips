import { frontmatterDateField } from './frontmatter-date-field.ts'

/** The `last_verified:` date in a wiki page's frontmatter, as `YYYY-MM-DD`.
 *
 * Null when the field is absent or is not a bare ISO date, which the caller
 * separates with `pageDeclaresLastVerified`: the field is optional, so absent
 * is the ordinary case and unreadable is a finding. */
export const pageLastVerifiedDate = (page: string): string | null =>
  frontmatterDateField(page, 'last_verified')
