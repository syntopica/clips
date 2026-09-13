import type { Clip } from '../clips/clip.ts'
import type { Repositories } from '../commands/repositories.ts'
import { fastForward } from '../git/fast-forward.ts'
import { fetchOrigin } from '../git/fetch-origin.ts'
import { ledgerRelativePath } from '../ledger/ledger-relative-path.ts'
import { clipRelativePath } from '../reconcile/clip-relative-path.ts'
import { reconcileClip } from '../reconcile/reconcile-clip.ts'
import { buildLedger } from './build-ledger.ts'
import { commitWikiAndLedger } from './commit-wiki-and-ledger.ts'
import { ledgerFileText } from './ledger-file-text.ts'
import type { PublishApprovedClipInput } from './publish-approved-clip-input.ts'
import { publishBranch } from './publish-branch.ts'

/** Steps 9-11 for an approved diff: one atomic wiki+ledger commit, publication
 * to origin/main before local integration, then clip reconciliation
 * (SPEC:394-433). Returns the sha origin/main carries. */
export const publishApprovedClip = async (
  repositories: Repositories,
  clip: Clip,
  input: PublishApprovedClipInput,
): Promise<string> => {
  const ledger = await buildLedger({
    clip,
    clipSourcePath: clipRelativePath(repositories.clips, clip.directory),
    clipRepoCommit: input.clipRepoCommit,
    brainBaseCommit: input.baseSha,
    pagesTouched: input.validatedPaths,
    pagesRead: input.pagesRead,
    identity: input.identity,
  })
  const commitSha = await commitWikiAndLedger({
    worktree: input.worktree,
    validatedPaths: input.validatedPaths,
    ledgerPath: ledgerRelativePath(ledger.clipId),
    ledgerText: await ledgerFileText(repositories.brain, ledger),
    // Conventional-commit shape, which the commit-msg hook enforces since
    // 2026-09-12: the wiki is documentation, so an ingest is `docs(brain)`.
    // Clip state is tracked by sha, never by subject, so older
    // `brain: ingest clip` commits stay resolvable.
    subject: `docs(brain): ingest clip ${clip.metadata.clip_id}`,
  })
  const published = await publishBranch(
    repositories.brain,
    input.worktree,
    clip.metadata.clip_id,
    commitSha,
  )
  await fetchOrigin(repositories.brain)
  await fastForward(repositories.brain, 'origin/main')
  await reconcileClip(repositories.clips, repositories.brain, clip, published)
  return published
}
