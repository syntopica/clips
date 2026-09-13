import type { ClipOutcome } from './clip-outcome.ts'
import { nonApplyReviewOutcome } from './non-apply-review-outcome.ts'
import { publishAndGradeClip } from './publish-and-grade-clip.ts'
import { reviewClipDiff } from './review-clip-diff.ts'
import { synthesizeAndValidate } from './synthesize-and-validate.ts'
import type { SynthesizeReviewAndPublishClipInput } from './synthesize-review-and-publish-clip-input.ts'

/** Steps 6-8 of the pipeline for one clip routed synthesis-candidate:
 * synthesize in the given worktree, validate every change hard, derive the
 * root map from what survived, and put the result in front of the reviewer.
 * Approval hands off to publishAndGradeClip, which reads the published page
 * rather than the worktree; every other exit leaves the brain untouched.
 *
 * Split out of processPendingClip, which still owns the worktree's lifetime:
 * this function neither creates it nor cleans it up. */
export const synthesizeReviewAndPublishClip = async (
  input: SynthesizeReviewAndPublishClipInput,
): Promise<ClipOutcome> => {
  const {
    repositories,
    clip,
    worktree,
    dependencies,
    baseSha,
    clipRepoCommit,
  } = input
  const synthesized = await synthesizeAndValidate({
    repositories,
    clip,
    worktree,
    synthesizer: dependencies.synthesizer,
    guidance: input.guidance,
  })
  if ('outcome' in synthesized) return synthesized.outcome
  const { verdict, reason } = await reviewClipDiff({
    worktree,
    clip,
    paths: synthesized.paths,
    reviewer: dependencies.reviewer,
    authorModel: synthesized.identity.model,
  })
  const outcome = await nonApplyReviewOutcome({
    clipsRepository: repositories.clips,
    clip,
    verdict,
    reason,
    automaticReviewer: dependencies.reviewer.automatic,
  })
  if (outcome !== null) return outcome
  await publishAndGradeClip(
    repositories,
    clip,
    {
      worktree,
      validatedPaths: synthesized.paths,
      baseSha,
      clipRepoCommit,
      pagesRead: synthesized.pagesRead,
      identity: synthesized.identity,
    },
    dependencies,
  )
  return 'published'
}
