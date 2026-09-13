import { refExists } from '../git/ref-exists.ts'
import { clearKeptBranchCommand } from '../publish/clear-kept-branch-command.ts'
import { ingestBranchName } from '../publish/ingest-branch-name.ts'
import { worktreeForBranch } from '../publish/worktree-for-branch.ts'

/** Whether an earlier run's `ingest/<clip_id>` branch is still there, reported
 * with the command that clears it.
 *
 * A skipped review keeps its worktree and branch on purpose, so the refused
 * synthesis stays recoverable. `recoverIngestBranches` then reports the pair as
 * kept and leaves it, which is right - and the next ingest of the same clip
 * used to reach `git worktree add -b` and die on `fatal: a branch named
 * 'ingest/<clip_id>' already exists`, taking the whole run with it before any
 * synthesis. The rejection history added on 2026-08-03 makes re-running that
 * clip the normal case, which is what turned a quirk into a stop.
 *
 * So the run says what is in the way and moves to the next clip. Clearing it is
 * left to the operator on purpose: the branch holds work a reviewer refused,
 * and deciding it is disposable is not the pipeline's call. */
export const reportKeptIngestBranch = async (
  brainRepository: string,
  clipId: string,
): Promise<boolean> => {
  const branch = ingestBranchName(clipId)
  if (!(await refExists(brainRepository, branch))) return false
  const worktree = await worktreeForBranch(brainRepository, branch)
  const command = clearKeptBranchCommand(brainRepository, branch, worktree)
  process.stdout.write(
    `${clipId}: ${branch} kept by an earlier run; clear it to synthesize again\n  ${command}\n`,
  )
  return true
}
