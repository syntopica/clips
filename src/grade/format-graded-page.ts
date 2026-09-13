import { deriveGradedClaims } from './derive-graded-claims.ts'
import { formatCleanGradeLine } from './format-clean-grade-line.ts'
import { formatGradeEvidenceLine } from './format-grade-evidence-line.ts'
import { formatUnsupportedGradeLines } from './format-unsupported-grade-lines.ts'
import type { GradedPage } from './graded-page.ts'

/** One page's block in the grade report. A failed page prints its reason and
 * never the word "clean": the whole point of the pass is that an ungraded
 * page is not a graded one. An exempt page prints as neither - it was never a
 * candidate, and printing it as a failure is what would make the pass fire
 * forever on the pages that maintain themselves elsewhere. */
export const formatGradedPage = (graded: GradedPage): string => {
  if (graded.exempt)
    return `${graded.page}: exempt - declares \`verification: exempt\`, nothing on disk to grade against\n`
  if (graded.failure !== null)
    return `${graded.page}: not graded - ${graded.failure}\n`
  const evidence = formatGradeEvidenceLine(graded)
  const { claims, misattributed } = deriveGradedClaims(graded)
  if (claims.length === 0 && misattributed.length === 0)
    return formatCleanGradeLine(graded, evidence)
  return formatUnsupportedGradeLines(
    graded.page,
    evidence,
    claims,
    misattributed,
  )
}
