import { refExists } from '../git/ref-exists.ts'
import { clearKeptBranchCommand } from '../publish/clear-kept-branch-command.ts'
import { ingestBranchName } from '../publish/ingest-branch-name.ts'
import { worktreeForBranch } from '../publish/worktree-for-branch.ts'

/** Why a clip cannot be requeued while an earlier run's `ingest/<clip_id>`
 * branch is still in the wiki repository, with the command that clears it, or
 * null when there is none.
 *
 * Requeueing past it only moved the problem: the clip went back to pending and
 * the next ingest stopped at once with "kept by an earlier run" (2026-10-05,
 * two clips cleared by hand). Clearing the branch is not this command's call,
 * because it may hold a diff a reviewer refused - so it refuses, names the
 * command, and writes nothing. */
export const keptBranchRefusal = async (
  brainRepository: string,
  clipId: string,
): Promise<string | null> => {
  const branch = ingestBranchName(clipId)
  if (!(await refExists(brainRepository, branch))) return null
  const worktree = await worktreeForBranch(brainRepository, branch)
  return `${branch} is still kept by an earlier run, so the next ingest would stop on it; save what it holds if it matters, clear it, then requeue:\n  ${clearKeptBranchCommand(brainRepository, branch, worktree)}`
}
