import type { GradeResult } from './grade-result.ts'
import { graderContradiction } from './grader-contradiction.ts'
import { noClaimsVerdict } from './no-claims-verdict.ts'

/** Why a verdict that parsed is still not a grade, or null when it is one.
 *
 * Two ways a well-formed answer is not usable, and they are different
 * questions. `graderContradiction` catches a report that disagrees with itself
 * - a summary naming a problem the list does not contain, which matters because
 * the count is what tooling reads and a finding living only in the prose is
 * reported as a clean page. `noClaimsVerdict` catches the empty one, where the
 * shape is right and the grader plainly never read the sources.
 *
 * Grouped here because the caller treats them identically and neither is about
 * the transport: both are judgements on an answer already in hand, which is the
 * one part of `gradePage` that has nothing to do with reading files or spending
 * quota. */
export const gradeVerdictFailure = (result: GradeResult): string | null =>
  graderContradiction(result) ?? noClaimsVerdict(result)
