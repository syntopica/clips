import { GitCommitFailedError } from './git-commit-failed-error.ts'
import { runGit } from './run-git.ts'

export const commitStagedChanges = async (
  repository: string,
  message: string,
): Promise<void> => {
  const result = await runGit(repository, ['commit', '-q', '-m', message])
  if (result.exitCode !== 0)
    throw new GitCommitFailedError(repository, message, result)
}
