import type { AuditFinding } from './audit-finding.ts'
import { collectPageFindings } from './collect-page-findings.ts'
import { pageContestedBeliefs } from './page-contested-beliefs.ts'

/** Contested entries with no date on them.
 *
 * The narrow half of the supersession convention, and the only half a tool can
 * judge. Whether the new belief really outranks the old one is prose a reader
 * has to weigh - the same limit `findOpenContradictions` states about which
 * side of a disagreement is which - but a superseded belief with no date is not
 * a weaker record, it is not a record at all: nothing says when the wiki
 * stopped holding it, so nothing can tell it from a note somebody left.
 *
 * Reporting only the undated ones is deliberate. Enumerating every contested
 * entry the way open contradictions are enumerated would grow without bound and
 * never fall to zero, because a superseded belief is kept forever by design,
 * where a contradiction is dropped when it settles. A check whose output only
 * grows is one the reader learns to skip. */
export const findUndatedSupersessions = async (
  brainRepository: string,
): Promise<AuditFinding[]> => {
  return collectPageFindings(brainRepository, (text, page) => {
    const findings: AuditFinding[] = []
    for (const entry of pageContestedBeliefs(text)) {
      if (/\d{4}-\d{2}-\d{2}/.test(entry)) continue
      findings.push({
        check: 'undated-supersession',
        subject: page,
        detail: `contested entry with no date: ${entry.slice(0, 80)}`,
      })
    }
    return findings
  })
}
