import type { AuditFinding } from './audit-finding.ts'
import { PAGE_REVIEW_DAYS } from './page-review-days.ts'
import { PAGE_STALE_DAYS } from './page-stale-days.ts'
import { pageUpdatedDate } from './page-updated-date.ts'
import { pagesWithText } from './pages-with-text.ts'

/** Pages nobody has touched in a long time.
 *
 * The wiki cannot see its own age from the inside: every page reads as current
 * prose whether it was written yesterday or three months ago, and a wrong page
 * that nobody revisits is indistinguishable from a right one. `updated:` is
 * already required of every page, so the check costs a frontmatter read and no
 * new field.
 *
 * `today` is a parameter rather than a call to the clock inside, so a test can
 * state the date it is asking about instead of arranging for one.
 *
 * A page with no readable `updated:` is reported rather than skipped - see
 * `pageUpdatedDate` for why - and a date in the future is left alone, because
 * the only thing that produces one here is a page written ahead of its own
 * `updated:` line, which is a formatting slip and not staleness. */
export const findStalePages = async (
  brainRepository: string,
  today: Date,
): Promise<AuditFinding[]> => {
  const findings: AuditFinding[] = []
  for (const [page, text] of await pagesWithText(brainRepository)) {
    const updated = pageUpdatedDate(text)
    if (updated === null) {
      findings.push({
        check: 'stale-page',
        subject: page,
        detail: 'no readable `updated:` date, so its age cannot be judged',
      })
      continue
    }
    const days = Math.floor(
      (today.getTime() - Date.parse(`${updated}T00:00:00Z`)) / 86_400_000,
    )
    if (days < PAGE_REVIEW_DAYS) continue
    findings.push({
      check: 'stale-page',
      subject: page,
      detail:
        days >= PAGE_STALE_DAYS
          ? `last updated ${updated}, ${String(days)} days ago; past the ${String(PAGE_STALE_DAYS)}-day stale line`
          : `last updated ${updated}, ${String(days)} days ago; due a review at ${String(PAGE_REVIEW_DAYS)} days`,
    })
  }
  return findings
}
