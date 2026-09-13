import type { MisattributedClaim } from './misattributed-claim.ts'
import type { UnsupportedClaim } from './unsupported-claim.ts'

/** The report line for a page carrying unsupported or misattributed claims:
 * a header naming both counts, then one indented block per claim. */
export const formatUnsupportedGradeLines = (
  page: string,
  evidence: string,
  claims: readonly UnsupportedClaim[],
  misattributed: readonly MisattributedClaim[],
): string => {
  const lines = claims.map((claim) => `  - "${claim.claim}"\n    ${claim.why}`)
  const misattributedLines = misattributed.map(
    (claim) =>
      `  ! ${claim.marker}${claim.shouldBe === null ? '' : ` -> ${claim.shouldBe}`}: "${claim.claim}"\n    ${claim.why}`,
  )
  const counts = [
    claims.length === 0 ? null : `${String(claims.length)} unsupported`,
    misattributed.length === 0
      ? null
      : `${String(misattributed.length)} misattributed`,
  ].filter((count) => count !== null)
  return `${page}: ${counts.join(', ')} (${evidence})\n${[...lines, ...misattributedLines].join('\n')}\n`
}
