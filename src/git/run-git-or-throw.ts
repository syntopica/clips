import { GitFailedError } from './git-failed-error.ts'
import { runGit } from './run-git.ts'

/** runGit for steps whose failure must stop the caller: throws GitFailedError
 * on a non-zero exit and returns the trimmed stdout otherwise. */
export const runGitOrThrow = async (
  repository: string,
  args: string[],
): Promise<string> => {
  const result = await runGit(repository, args)
  if (result.exitCode !== 0)
    throw new GitFailedError(args, result.exitCode, result.stderr)
  return result.stdout.trim()
}
