import type { AuditFinding } from './audit-finding.ts'
import { contradictionDetail } from './contradiction-detail.ts'
import { pageContradictions } from './page-contradictions.ts'
import { pageSourceTiers } from './page-source-tiers.ts'
import { pagesWithText } from './pages-with-text.ts'

/** Every contradiction a page declares, listed.
 *
 * SCHEMA.md has always told the synthesizer to name a contradiction in the page
 * rather than resolve it silently, and that rule works at write time and
 * nowhere else: a month later the sentence is somewhere in a paragraph, and
 * there is no way to ask the wiki what is currently unresolved. `green-dalii`
 * makes each one a file with a state; the version here is the smallest thing
 * that makes them enumerable - a frontmatter list and this check - because a
 * state machine over a set nobody can list yet is the wrong end to start from.
 *
 * Reporting an open contradiction is not calling it a defect. A contradiction
 * held with both citations is the correct outcome when two sources disagree;
 * what the audit adds is that it stops being invisible.
 *
 * Since 2026-08-03 each one carries the authority tiers of the page's own
 * sources, so the enumeration says which side outranks and not only that a
 * disagreement exists. It is attached here rather than checked, because the
 * contradiction is a line of prose and nothing can tell which of the page's
 * sources is which side of it. Reading that is the human's job; the ranking is
 * what they were missing. */
export const findOpenContradictions = async (
  brainRepository: string,
): Promise<AuditFinding[]> => {
  const findings: AuditFinding[] = []
  for (const [page, text] of await pagesWithText(brainRepository)) {
    const tiers = pageSourceTiers(text)
    for (const contradiction of pageContradictions(text))
      findings.push({
        check: 'open-contradiction',
        subject: page,
        detail: contradictionDetail(contradiction, tiers),
      })
  }
  return findings
}
