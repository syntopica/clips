import { pageClaimRefs } from '../citations/page-claim-refs.ts'
import { refsForSources } from '../citations/refs-for-sources.ts'
import type { AuditFinding } from './audit-finding.ts'
import { pageSources } from './page-sources.ts'
import { pagesWithText } from './pages-with-text.ts'

/** Sources a page lists and no claim on it cites.
 *
 * Reported **only on a page that already carries at least one marker**, which
 * is the whole design of the check. On a grandfathered page every source is
 * uncited and the finding would be noise on all 110 of them; on a page written
 * under the scheme it means one of two real things - a source was consulted and
 * never used, or a marker was lost in an edit.
 *
 * A half-marked page is skipped: a run that appends two sentences to a long
 * page marks its own sentences and cannot mark the rest, so every pre-scheme
 * source on it would read as uncited - measured at 175 findings across three
 * sweep pages on 2026-08-11, none of them a lost marker. The two populations
 * are separable from the page alone: the check's real failures (a source
 * consulted and never used, a marker lost in an edit) leave a few gaps on a
 * well-marked page, while a half-marked page is a few markers against many
 * gaps. So a finding is reported only when the page carries at least as many
 * distinct markers as it has uncited sources - distinct, so one source cited
 * many times does not vouch for a page, and counting `OWN`, which marks a
 * claim as under the scheme without citing anything. The per-run alternative
 * the spec's open question names - keying on the claims a run touched - needs
 * run data an offline audit does not have; the gate is where that check could
 * live. */
export const findUncitedSources = async (
  brainRepository: string,
): Promise<AuditFinding[]> => {
  const findings: AuditFinding[] = []
  for (const [page, text] of await pagesWithText(brainRepository)) {
    const refs = pageClaimRefs(text)
    if (refs.length === 0) continue
    const sources = pageSources(text)
    const sourceRefs = refsForSources(sources)
    const uncited = sourceRefs.filter((ref) => !refs.includes(ref))
    if (uncited.length === 0) continue
    if (new Set(refs).size < uncited.length) continue
    findings.push({
      check: 'uncited-source',
      subject: page,
      detail: `${uncited.join(', ')} listed in sources and cited by no claim`,
    })
  }
  return findings
}
