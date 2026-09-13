/** How long a page may sit untouched before the audit asks for a look at it.
 *
 * Copied from `anh-chu`, the most complete staleness model in the 2026-08-02
 * ecosystem survey: a 30-day flag first, then a hard stale line at
 * `PAGE_STALE_DAYS`. The two tiers matter because they mean different things -
 * this one is "read it and confirm it still holds", the other is "this has been
 * unattended long enough to be wrong". */
export const PAGE_REVIEW_DAYS = 30
