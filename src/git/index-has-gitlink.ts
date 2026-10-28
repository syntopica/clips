import { runGit } from './run-git.ts'

/** Whether any index entry is a gitlink (mode 160000), tracked or newly
 * staged. A commit records a gitlink as the inner repository's HEAD alone, so
 * nothing in it holds that repository's files, objects or uncommitted work -
 * whether `git add -A` just staged an untracked embedded repository or a
 * tracked submodule has local changes behind an unchanged HEAD. */
export const indexHasGitlink = async (repository: string): Promise<boolean> => {
  const result = await runGit(repository, ['ls-files', '--stage'])
  return result.stdout.split('\n').some((line) => line.startsWith('160000 '))
}
