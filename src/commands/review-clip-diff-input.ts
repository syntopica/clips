import type { Clip } from '../clips/clip.ts'
import type { Reviewer } from '../review/reviewer.ts'

/** What reviewClipDiff needs to put a validated diff in front of the
 * reviewer: where the diff lives, which clip and paths it covers, the
 * reviewer to hand it to, and the model that authored it. */
export type ReviewClipDiffInput = {
  worktree: string
  clip: Clip
  paths: string[]
  reviewer: Reviewer
  authorModel: string
}
