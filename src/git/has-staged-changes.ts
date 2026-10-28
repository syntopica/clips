import { runGit } from './run-git.ts'

/** Whether the index differs from HEAD. `diff --cached --quiet` exits 1 when
 * it does and 0 when it does not; any other code is treated as staged, the
 * answer that keeps work. `--ignore-submodules=none` overrides a
 * `diff.ignoreSubmodules` setting that would hide a staged submodule change. */
export const hasStagedChanges = async (
  repository: string,
): Promise<boolean> => {
  const result = await runGit(repository, [
    'diff',
    '--cached',
    '--quiet',
    '--ignore-submodules=none',
  ])
  return result.exitCode !== 0
}
