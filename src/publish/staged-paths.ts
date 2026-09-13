import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'
import { splitNul } from '../git/split-nul.ts'

/** What is actually in the index, so the committer can confirm the staged set
 * equals the validated set plus the ledger and nothing else (SPEC:355-359). */
export const stagedPaths = async (worktree: string): Promise<string[]> => {
  const args = ['diff', '--cached', '--name-only', '-z']
  const result = await runGit(worktree, args)
  if (result.exitCode !== 0)
    throw new GitFailedError(args, result.exitCode, result.stderr)
  return splitNul(result.stdout).sort()
}
