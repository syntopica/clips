import { createdPages } from '../grade/created-pages.ts'
import type { PageGrader } from '../grade/page-grader.ts'
import type { PublishApprovedClipInput } from '../publish/publish-approved-clip-input.ts'
import type { Repositories } from './repositories.ts'

/** Step 0 of the post-ingest loop, moved inside the run it grades. It ran by
 * hand until now, which meant a batch that forgot it was silently ungraded -
 * and an ungraded batch leaves the synthesizer as both generator and verifier.
 *
 * A null grader is `--grade` left off, not a failure. The flag is off by
 * default because the pass costs a codex run per page, and it grades only the
 * pages this clip created for the same reason.
 *
 * It takes the publication input whole rather than three fields out of it,
 * because `identity` joined `baseSha` and `validatedPaths` here: the grader
 * needs to know who wrote the page so it refuses only the models that could
 * have. Which is to say the ledger's provenance record and the author/verifier
 * guard want the same value, and there is no reason to pull it apart. */
export const gradeCreatedPages = async (
  repositories: Repositories,
  input: PublishApprovedClipInput,
  grader: PageGrader | null,
): Promise<void> => {
  if (grader === null) return
  const created = await createdPages(
    repositories.brain,
    input.baseSha,
    input.validatedPaths,
  )
  if (created.length === 0) {
    process.stdout.write('grade: this clip created no new page; not graded\n')
    return
  }
  await grader.grade(
    repositories.brain,
    repositories.clips,
    created,
    input.identity.model,
  )
}
