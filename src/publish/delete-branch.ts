import { runGit } from '../git/run-git.ts'

/** `-d`, never `-D`: an unmerged branch survives and is reported. Returns
 * null when deleted, or what was kept. */
export const deleteBranch = async (
  repository: string,
  branch: string,
): Promise<string | null> => {
  const deleted = await runGit(repository, ['branch', '-d', branch])
  return deleted.exitCode === 0 ? null : `branch ${branch}`
}
