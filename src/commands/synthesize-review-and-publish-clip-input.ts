import type { Clip } from '../clips/clip.ts'
import type { IngestDependencies } from './ingest-dependencies.ts'
import type { Repositories } from './repositories.ts'

/** What synthesizeReviewAndPublishClip needs to carry one clip through
 * synthesis, review and publication: the repositories and dependencies the
 * whole pipeline shares, the clip and its already-created worktree, the two
 * commits the published page will be attributed to, and the guidance carried
 * forward from a prior rejection. */
export type SynthesizeReviewAndPublishClipInput = {
  repositories: Repositories
  clip: Clip
  worktree: string
  dependencies: IngestDependencies
  baseSha: string
  clipRepoCommit: string
  guidance: string
}
