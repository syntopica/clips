import type { Clip } from '../clips/clip.ts'
import { MAX_REJECTIONS } from '../rejections/max-rejections.ts'
import { recordRejection } from '../rejections/record-rejection.ts'
import type { ClipOutcome } from './clip-outcome.ts'
import { routeRejectionLimitClip } from './route-rejection-limit-clip.ts'

/** A skip, kept. The reviewer's reason is appended to the clip and pushed, so
 * the next synthesis is told what was wrong rather than reproducing the draft
 * that was already refused - which is what a skip used to cost, since it left
 * the clip pending with nothing recorded.
 *
 * The ceiling is checked here, on the rejection that reaches it, rather than
 * before synthesis. A clip at the ceiling has already left `pending`, so a
 * pre-flight check would be a branch nothing can reach. */
export const recordReviewRejection = async (
  clipsRepository: string,
  clip: Clip,
  reason: string,
): Promise<ClipOutcome> => {
  const rejections = await recordRejection(clipsRepository, clip, reason)
  process.stdout.write(
    `${clip.metadata.clip_id}: rejection ${String(rejections)}/${String(MAX_REJECTIONS)} recorded\n`,
  )
  if (rejections < MAX_REJECTIONS) return 'skipped'
  return routeRejectionLimitClip(clipsRepository, clip, rejections)
}
