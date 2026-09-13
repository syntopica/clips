import { evidenceBytes } from './evidence-bytes.ts'
import { overBudgetFailure } from './over-budget-failure.ts'

/** Null when this evidence set may be graded by this transport, or the refusal
 * to report.

 * Checked before the run, not after: over budget the grader reads until its
 * timeout and comes back as a bare non-zero exit, or - on agy - never starts at
 * all with `spawn E2BIG`. Neither says why. Refusing up front is the same
 * answer with the numbers attached.
 *
 * The ceiling comes from the runner rather than from a constant here, because
 * the two transports are bounded by different things: see
 * `evidenceCeilingBytes` on `GradeRunner`. */
export const gradeableEvidence = async (
  paths: readonly string[],
  ceilingBytes: number,
): Promise<string | null> => {
  const bytes = await evidenceBytes(paths)
  return bytes > ceilingBytes
    ? overBudgetFailure(bytes, paths.length, ceilingBytes)
    : null
}
