import { AUDIT_CHECK_HEADINGS } from './audit-check-headings.ts'
import type { AuditFinding } from './audit-finding.ts'

/** Grouped by check, in the order the headings declare, so the report reads as
 * one answer per question rather than one undifferentiated list. A check with
 * nothing to say still prints its heading and `none`, because a silent check
 * and a check that did not run look identical otherwise. */
export const formatAuditReport = (
  findings: readonly AuditFinding[],
): string => {
  const lines: string[] = []
  for (const [check, heading] of Object.entries(AUDIT_CHECK_HEADINGS)) {
    const own = findings.filter((finding) => finding.check === check)
    lines.push(`\n${heading}`)
    if (own.length === 0) {
      lines.push('  none')
      continue
    }
    for (const finding of own)
      lines.push(`  ${finding.subject}: ${finding.detail}`)
  }
  return `${lines.join('\n')}\n`
}
