import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'

/** Put an ingest worktree back to its base commit: every tracked page restored
 * and every untracked file a synthesis created removed. Ignored files stay. */
export const discardWorktreeChanges = async (
  worktree: string,
): Promise<void> => {
  for (const args of [
    ['checkout', '--', '.'],
    ['clean', '-fdq'],
  ]) {
    const result = await runGit(worktree, args)
    if (result.exitCode !== 0)
      throw new GitFailedError(args, result.exitCode, result.stderr)
  }
}
