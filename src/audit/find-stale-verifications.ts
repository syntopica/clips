import { pageVerificationExempt } from '../grade/page-verification-exempt.ts'
import type { AuditFinding } from './audit-finding.ts'
import { pageDeclaresLastVerified } from './page-declares-last-verified.ts'
import { pageLastVerifiedDate } from './page-last-verified-date.ts'
import { PAGE_VERIFIED_DAYS } from './page-verified-days.ts'
import { pagesWithText } from './pages-with-text.ts'

/** Verification claims that have aged out.
 *
 * `updated:` says when a page was last written; it says nothing about when
 * anyone last read it against the thing it describes, and the stale-page check
 * cannot tell the two apart - an edit to one sentence makes a whole page look
 * current. `last_verified:` is the second date, written by whoever did that
 * reading, and this check is the clock on it.
 *
 * It ages a claim out; it does not demand one. A page without the field is
 * silent here, deliberately: requiring it of every page would fire on all 49
 * non-exempt pages the day it shipped, which is the always-fires shape that got
 * an earlier check removed after it flagged 86 of 90 pages and carried no
 * information. An exempt page is skipped for the reason it is exempt - nothing
 * in this repository can verify it, so there is no reading for a date to record.
 *
 * A declared but unreadable date is reported rather than treated as absent,
 * because absent and unreadable mean opposite things and only one of them is
 * the ordinary case.
 *
 * `today` is a parameter rather than a call to the clock inside, so a test can
 * state the date it is asking about instead of arranging for one. */
export const findStaleVerifications = async (
  brainRepository: string,
  today: Date,
): Promise<AuditFinding[]> => {
  const findings: AuditFinding[] = []
  for (const [page, text] of await pagesWithText(brainRepository)) {
    if (pageVerificationExempt(text)) continue
    if (!pageDeclaresLastVerified(text)) continue
    const verified = pageLastVerifiedDate(text)
    if (verified === null) {
      findings.push({
        check: 'stale-verification',
        subject: page,
        detail:
          'declares `last_verified:` but not as a bare `YYYY-MM-DD` date, so the claim cannot be aged',
      })
      continue
    }
    const days = Math.floor(
      (today.getTime() - Date.parse(`${verified}T00:00:00Z`)) / 86_400_000,
    )
    if (days < PAGE_VERIFIED_DAYS) continue
    findings.push({
      check: 'stale-verification',
      subject: page,
      detail: `last verified ${verified}, ${String(days)} days ago; past the ${String(PAGE_VERIFIED_DAYS)}-day line`,
    })
  }
  return findings
}
