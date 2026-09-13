import { GitFailedError } from './git-failed-error.ts'
import { runGit } from './run-git.ts'

/** Verified: in a repository with no commits, `rev-parse --abbrev-ref HEAD`
 * exits 128 and still prints the literal string "HEAD" on stdout, so trimming
 * stdout alone reports a branch named HEAD for a repository that has none. A
 * detached HEAD prints the same thing. Read the exit code, not the accident. */
export const currentBranch = async (repository: string): Promise<string> => {
  const args = ['rev-parse', '--abbrev-ref', 'HEAD']
  const result = await runGit(repository, args)
  if (result.exitCode !== 0)
    throw new GitFailedError(args, result.exitCode, result.stderr)
  return result.stdout.trim()
}
