import type { Clip } from '../clips/clip.ts'
import { resolveCommit } from '../git/resolve-commit.ts'
import { createIngestWorktree } from '../publish/create-ingest-worktree.ts'
import { formatRejectionGuidance } from '../rejections/format-rejection-guidance.ts'
import { readRejections } from '../rejections/read-rejections.ts'
import type { ClipOutcome } from './clip-outcome.ts'
import type { IngestDependencies } from './ingest-dependencies.ts'
import { reportKeptArtifacts } from './report-kept-artifacts.ts'
import { reportKeptIngestBranch } from './report-kept-ingest-branch.ts'
import type { Repositories } from './repositories.ts'
import { synthesizeReviewAndPublishClip } from './synthesize-review-and-publish-clip.ts'

/** Steps 6-8 of the pipeline for one clip routed synthesis-candidate: create
 * an isolated worktree, then hand it to synthesizeReviewAndPublishClip for
 * synthesis, validation, review and publication. Worktree cleanup is
 * unforced, so abandoned work is kept and reported rather than destroyed.
 *
 * A rejection is kept too. Why the reviewer turned a draft down is recorded on
 * the clip and read back here as `guidance` on the next run, so the model is
 * told what was wrong rather than reproducing the draft that was refused.
 *
 * What a rejection also keeps is the branch, which is why the first thing here
 * is a look for it: a re-run that walked into `git worktree add -b` stopped the
 * whole batch inside git, and the guidance above only reaches a run that gets
 * that far. */
export const processPendingClip = async (
  repositories: Repositories,
  clip: Clip,
  dependencies: IngestDependencies,
): Promise<ClipOutcome> => {
  const clipId = clip.metadata.clip_id
  if (await reportKeptIngestBranch(repositories.brain, clipId)) return 'stopped'
  const guidance = formatRejectionGuidance(await readRejections(clip.directory))
  const baseSha = await resolveCommit(repositories.brain, 'origin/main')
  const clipRepoCommit = await resolveCommit(repositories.clips, 'main')
  const worktree = await createIngestWorktree(
    repositories.brain,
    clipId,
    baseSha,
  )
  try {
    return await synthesizeReviewAndPublishClip({
      repositories,
      clip,
      worktree,
      dependencies,
      baseSha,
      clipRepoCommit,
      guidance,
    })
  } finally {
    await reportKeptArtifacts(repositories.brain, clipId, worktree)
  }
}
