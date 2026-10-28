import { hasIgnoredFiles } from '../git/has-ignored-files.ts'
import { hasStagedChanges } from '../git/has-staged-changes.ts'
import { indexHasGitlink } from '../git/index-has-gitlink.ts'
import { isWorkingTreeClean } from '../git/is-working-tree-clean.ts'
import { runGitOrThrow } from '../git/run-git-or-throw.ts'
import { runGit } from '../git/run-git.ts'
import { ingestDraftRef } from './ingest-draft-ref.ts'

/** Records a worktree's uncommitted synthesis as a commit under
 * ingestDraftRef, without moving its branch, and returns the ref; null when
 * the worktree is clean, or when one commit cannot hold everything in it and
 * the checkout has to stay.
 *
 * The branch must not move: recoverIngestBranches pushes any ingest branch
 * ahead of origin/main, which would publish a draft the reviewer refused. So
 * the commit is built with write-tree and commit-tree, and only the draft ref
 * points at it. A kept worktree is a full instance checkout (2.4 GiB on
 * 2026-10-28) holding a one-to-three file diff; once the diff is a commit the
 * checkout can go.
 *
 * Three states cannot be captured by one commit, and both return null so the
 * caller keeps the worktree as before: an index that already differs from
 * HEAD (staging again would overwrite the staged version with the working
 * one), ignored files, which `add -A` leaves out, and any gitlink - an untracked embedded repository that `add -A`
 * stages, or a tracked submodule - whose contents a commit does not hold. In
 * the second case the index is reset back to HEAD, which is where it was. */
export const saveIngestDraft = async (
  worktree: string,
  clipId: string,
): Promise<string | null> => {
  if (await isWorkingTreeClean(worktree)) return null
  if (await hasStagedChanges(worktree)) return null
  if (await hasIgnoredFiles(worktree)) return null
  await runGitOrThrow(worktree, ['add', '-A'])
  if (await indexHasGitlink(worktree)) {
    await runGit(worktree, ['reset', '-q'])
    return null
  }
  const tree = await runGitOrThrow(worktree, ['write-tree'])
  const commit = await runGitOrThrow(worktree, [
    'commit-tree',
    tree,
    '-p',
    'HEAD',
    '-m',
    `ingest draft kept for ${clipId}`,
  ])
  const ref = ingestDraftRef(clipId)
  await runGitOrThrow(worktree, ['update-ref', ref, commit])
  // Back to the index it had, so a run stopped before the checkout is removed
  // leaves a worktree the next recovery can save and remove again.
  await runGitOrThrow(worktree, ['reset', '-q'])
  return ref
}
