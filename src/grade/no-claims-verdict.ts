import type { GradeResult } from './grade-result.ts'
import { NO_CLAIMS_SIGNALS } from './no-claims-signals.ts'

/** A `clean` verdict from a grader whose own summary says it saw no claims,
 * returning the reason it must not count or null when the verdict is real.
 *
 * Measured on 2026-08-08, twice in one batch: the agy transport truncated the
 * evidence, the grader's summary said so — "the prompt was truncated before
 * any specific claims were provided", "no task to complete" — and both pages
 * still printed `clean`, exit 0. That is the author-verifier guard defeated by
 * silence: a no-op verdict is indistinguishable from a real pass, and the
 * schema forces a verdict even when there was nothing to judge.
 *
 * Only a `clean` verdict with every list empty is examined. A grader that
 * listed anything did read the page, whatever its summary says, and an
 * `unsupported` label already has `graderContradiction` watching it. */
export const noClaimsVerdict = (result: GradeResult): string | null => {
  if (result.verdict !== 'clean') return null
  if (
    result.unsupported.length > 0 ||
    result.uncheckable.length > 0 ||
    result.misattributed.length > 0
  )
    return null
  if (!NO_CLAIMS_SIGNALS.some((signal) => signal.test(result.summary)))
    return null
  return `grader reports it saw no claims and still labelled the page clean; its summary reads: ${result.summary}`
}
