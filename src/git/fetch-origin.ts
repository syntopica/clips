import { GitFailedError } from './git-failed-error.ts'
import { runGit } from './run-git.ts'

export const fetchOrigin = async (repository: string): Promise<void> => {
  const args = ['fetch', '--prune', 'origin']
  const result = await runGit(repository, args)
  if (result.exitCode !== 0)
    throw new GitFailedError(args, result.exitCode, result.stderr)
}
