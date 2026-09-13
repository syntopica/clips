import { frontmatterDateField } from './frontmatter-date-field.ts'

/** The `updated:` date in a wiki page's frontmatter, as `YYYY-MM-DD`.
 *
 * Null when the field is absent or is not a bare ISO date. Both cases are the
 * caller's to report rather than to repair: `frontmatterFailure` already
 * requires the field of every synthesized page, so a page reaching here without
 * a readable one predates the pipeline or was hand-edited, and either way a
 * staleness check that silently skips it would hide the oldest pages in the
 * wiki - exactly the ones it exists to surface. */
export const pageUpdatedDate = (page: string): string | null =>
  frontmatterDateField(page, 'updated')
