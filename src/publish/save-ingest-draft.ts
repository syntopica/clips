import { isWorkingTreeClean } from '../git/is-working-tree-clean.ts'
import { runGitOrThrow } from '../git/run-git-or-throw.ts'
import { ingestDraftRef } from './ingest-draft-ref.ts'

/** Records a worktree's uncommitted synthesis as a commit under
 * ingestDraftRef, without moving its branch, and returns the ref; null when
 * the worktree is clean and there is nothing to keep.
 *
 * The branch must not move: recoverIngestBranches pushes any ingest branch
 * ahead of origin/main, which would publish a draft the reviewer refused. So
 * the commit is built with write-tree and commit-tree, and only the draft ref
 * points at it. A kept worktree is a full instance checkout (2.4 GiB on
 * 2026-10-28) holding a one-to-three file diff; once the diff is a commit the
 * checkout can go. */
export const saveIngestDraft = async (
  worktree: string,
  clipId: string,
): Promise<string | null> => {
  if (await isWorkingTreeClean(worktree)) return null
  await runGitOrThrow(worktree, ['add', '-A'])
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
  return ref
}
