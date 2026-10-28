import { runGit } from './run-git.ts'

/** Whether any index entry is marked assume-unchanged (a lowercase tag in
 * `ls-files -v`) or skip-worktree (tag `S`). Git does not look at those files'
 * working copies, so `add -A` would leave their local edits out of a commit. */
export const hasHiddenIndexEntries = async (
  repository: string,
): Promise<boolean> => {
  const result = await runGit(repository, ['ls-files', '-v'])
  return result.stdout.split('\n').some((line) => /^[a-zS] /u.test(line))
}
