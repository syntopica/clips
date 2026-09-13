import { pageClaimRefs } from '../citations/page-claim-refs.ts'
import { unresolvedClaimRefs } from '../citations/unresolved-claim-refs.ts'
import type { AuditFinding } from './audit-finding.ts'
import { pageSources } from './page-sources.ts'
import { pagesWithText } from './pages-with-text.ts'

/** Pages whose claim markers name a source the page does not have.
 *
 * The wiki-wide lint checks that markers **resolve**, never that they exist.
 * That distinction is the design's, and it is what keeps this check from being
 * the always-fires shape this repository has switched off once: an inferred
 * `reviewed:` fired on 86 of 90 pages and was removed, and a `last_verified:`
 * that demanded a date would have fired on all 49 non-exempt pages the day it
 * shipped. Demanding a marker of every claim would be the same mistake at
 * sentence granularity.
 *
 * So a page carrying no markers is silent here, which is every one of the 110
 * pages that exist today. They are grandfathered rather than backfilled: their
 * prose cannot be attributed mechanically, and this reporting nothing on them
 * is the honest baseline. */
export const findUnresolvedClaimRefs = async (
  brainRepository: string,
): Promise<AuditFinding[]> => {
  const findings: AuditFinding[] = []
  for (const [page, text] of await pagesWithText(brainRepository)) {
    const unresolved = unresolvedClaimRefs(
      pageClaimRefs(text),
      pageSources(text),
    )
    if (unresolved.length === 0) continue
    findings.push({
      check: 'unresolved-claim-ref',
      subject: page,
      detail: `${unresolved.join(', ')} names no entry in a ${String(pageSources(text).length)}-source list`,
    })
  }
  return findings
}
