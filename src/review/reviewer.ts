import type { ReviewInput } from './review-input.ts'
import type { ReviewOutcome } from './review-outcome.ts'

/** There is no --yes flag (SPEC:281-284): tests inject an implementation that
 * always approves, and the terminal implementation is the only interactive
 * path. */
export type Reviewer = {
  /** Whether a machine decided rather than a person. It changes what an
   * escalation means downstream: a person who escalates has overruled the
   * pipeline and `clips requeue` must not undo them, while an automatic
   * reviewer's escalation is a verdict under a policy that can change - and did
   * on 2026-08-08, when the new-page bound was lifted and four parked clips had
   * no supported way back. */
  automatic: boolean
  review(input: ReviewInput): Promise<ReviewOutcome>
}
