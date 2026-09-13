/** How long a page may sit untouched before the audit calls it stale.
 *
 * 90 days, `anh-chu`'s number. Nothing in this wiki is near it yet - it is a
 * month old and its oldest page dates from 2026-07-24 - which is the reason to
 * write the check now rather than when the first page crosses the line: a
 * threshold added after the fact is chosen to fit whatever it finds. */
export const PAGE_STALE_DAYS = 90
