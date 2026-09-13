import type { Clip } from '../clips/clip.ts'
import type { PublishApprovedClipInput } from '../publish/publish-approved-clip-input.ts'
import { publishApprovedClip } from '../publish/publish-approved-clip.ts'
import { gradeCreatedPages } from './grade-created-pages.ts'
import type { IngestDependencies } from './ingest-dependencies.ts'
import type { Repositories } from './repositories.ts'

/** What an approved diff gets: publication, then grading. Grading follows
 * publication rather than preceding it because the grader reads the page as it
 * now stands on `origin/main`, not the worktree copy the reviewer saw. Same
 * input as publication alone, since grading needs nothing publication did not
 * already require - `input.identity` is the ledger's record of who wrote the
 * page, and it answers the grade lane's author/verifier question too. */
export const publishAndGradeClip = async (
  repositories: Repositories,
  clip: Clip,
  input: PublishApprovedClipInput,
  dependencies: IngestDependencies,
): Promise<void> => {
  await publishApprovedClip(repositories, clip, input)
  await gradeCreatedPages(repositories, input, dependencies.grader)
}
