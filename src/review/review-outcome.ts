import type { ReviewVerdict } from './review-verdict.ts'

/** What the reviewer decided, and - on `skip` only - why.
 *
 * `reason` is empty for every other verdict. Apply needs no justification,
 * `claude` already records one in the clip's failure, and `quit` is about the
 * run rather than the draft. */
export type ReviewOutcome = {
  verdict: ReviewVerdict
  reason: string
}
