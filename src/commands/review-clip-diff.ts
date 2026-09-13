import { runGit } from '../git/run-git.ts'
import type { ReviewOutcome } from '../review/review-outcome.ts'
import { reviewSummary } from '../review/review-summary.ts'
import type { ReviewClipDiffInput } from './review-clip-diff-input.ts'

/** Step 8: put the validated diff in front of the reviewer, with the full
 * diff available on demand. */
export const reviewClipDiff = async (
  input: ReviewClipDiffInput,
): Promise<ReviewOutcome> =>
  input.reviewer.review({
    summary: await reviewSummary(input.worktree, input.clip, input.paths),
    authorModel: input.authorModel,
    clipId: input.clip.metadata.clip_id,
    fullDiff: async () =>
      (await runGit(input.worktree, ['diff', 'HEAD', '--', ...input.paths]))
        .stdout,
  })
