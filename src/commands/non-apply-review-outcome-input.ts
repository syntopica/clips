import type { Clip } from '../clips/clip.ts'
import type { ReviewVerdict } from '../review/review-verdict.ts'

/** What nonApplyReviewOutcome needs to turn a non-apply verdict into a clip
 * outcome: which clips repository to record a rejection or escalation into,
 * the clip and the reviewer's verdict and reason, and whether the reviewer
 * that gave it was automatic. */
export type NonApplyReviewOutcomeInput = {
  clipsRepository: string
  clip: Clip
  verdict: ReviewVerdict
  reason: string
  automaticReviewer: boolean
}
