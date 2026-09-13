import type { Clip } from '../clips/clip.ts'
import { routeToNeedsClaude } from '../reconcile/route-to-needs-claude.ts'
import { MAX_REJECTIONS } from '../rejections/max-rejections.ts'
import type { ClipOutcome } from './clip-outcome.ts'

/** The reviewer has now turned down `MAX_REJECTIONS` drafts of this clip, so it
 * stops being offered to a model and goes to a person - in the same failure
 * shape every other escalation uses, so `clips status` reports one kind.
 *
 * `REVIEW_REJECTION_LIMIT` is deliberately not in `RETRYABLE_FAILURE_CODES`:
 * `clips requeue` exists to undo a transport failure, and five human rejections
 * are the opposite of that. Moving the clip back to pending by hand still
 * works, and then the reasons are handed to the synthesizer as guidance, which
 * is the one re-run that has a chance of being different. */
export const routeRejectionLimitClip = async (
  clipsRepository: string,
  clip: Clip,
  rejections: number,
): Promise<ClipOutcome> => {
  await routeToNeedsClaude(clipsRepository, clip, {
    stage: 'review',
    code: 'REVIEW_REJECTION_LIMIT',
    message: `the reviewer rejected ${String(rejections)} drafts; the ceiling is ${String(MAX_REJECTIONS)}`,
  })
  return 'needs-claude'
}
