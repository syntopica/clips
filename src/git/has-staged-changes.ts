import { runGit } from './run-git.ts'

/** Whether the index differs from HEAD. `diff --cached --quiet` exits 1 when
 * it does and 0 when it does not; any other code is treated as staged, the
 * answer that keeps work. */
export const hasStagedChanges = async (
  repository: string,
): Promise<boolean> => {
  const result = await runGit(repository, ['diff', '--cached', '--quiet'])
  return result.exitCode !== 0
}
