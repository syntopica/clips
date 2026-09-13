import { runGit } from '../git/run-git.ts'
import { ingestBranchName } from './ingest-branch-name.ts'

/** Cleanup that refuses to destroy work: no `--force` on either command, so a
 * worktree with uncommitted changes or an unmerged branch survives and is
 * reported instead of deleted (SPEC:435-436: report every artifact
 * deliberately kept for recovery). Returns what was kept, or null when
 * everything was removed. */
export const removeIngestWorktree = async (
  brainRepository: string,
  clipId: string,
  worktree: string,
): Promise<string | null> => {
  const kept: string[] = []
  const removed = await runGit(brainRepository, [
    'worktree',
    'remove',
    worktree,
  ])
  if (removed.exitCode !== 0) kept.push(`worktree ${worktree}`)
  const branch = ingestBranchName(clipId)
  const deleted = await runGit(brainRepository, ['branch', '-d', branch])
  if (deleted.exitCode !== 0) kept.push(`branch ${branch}`)
  return kept.length === 0 ? null : kept.join(', ')
}
