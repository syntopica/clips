import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'

/** The checked-out worktree directory for a branch, or null when none exists.
 * `worktree list --porcelain` pairs a `worktree <path>` line with a `branch
 * refs/heads/<name>` line per entry. */
export const worktreeForBranch = async (
  repository: string,
  branch: string,
): Promise<string | null> => {
  const args = ['worktree', 'list', '--porcelain']
  const result = await runGit(repository, args)
  if (result.exitCode !== 0)
    throw new GitFailedError(args, result.exitCode, result.stderr)
  let current: string | null = null
  for (const line of result.stdout.split('\n')) {
    if (line.startsWith('worktree ')) current = line.slice('worktree '.length)
    if (line === `branch refs/heads/${branch}`) return current
  }
  return null
}
