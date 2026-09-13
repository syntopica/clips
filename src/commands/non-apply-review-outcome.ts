import type { ClipOutcome } from './clip-outcome.ts'
import type { NonApplyReviewOutcomeInput } from './non-apply-review-outcome-input.ts'
import { recordReviewRejection } from './record-review-rejection.ts'
import { routeEscalatedClip } from './route-escalated-clip.ts'

/** The clip's outcome for every review verdict except `apply`, or null when
 * the verdict is `apply` and the caller should proceed to publish. */
export const nonApplyReviewOutcome = async (
  input: NonApplyReviewOutcomeInput,
): Promise<ClipOutcome | null> => {
  const { clipsRepository, clip, verdict, reason, automaticReviewer } = input
  if (verdict === 'skip')
    return await recordReviewRejection(clipsRepository, clip, reason)
  if (verdict === 'quit') return 'quit'
  if (verdict === 'claude')
    return await routeEscalatedClip(
      clipsRepository,
      clip,
      reason,
      automaticReviewer,
    )
  return null
}
