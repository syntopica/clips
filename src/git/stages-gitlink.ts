import { runGit } from './run-git.ts'

/** Whether the index records a gitlink (mode 160000) that HEAD does not have.
 * `git add -A` stages an untracked embedded repository as a gitlink: the
 * commit then names the inner HEAD but holds none of its files or objects. */
export const stagesGitlink = async (repository: string): Promise<boolean> => {
  const result = await runGit(repository, ['diff', '--cached', '--raw'])
  return result.stdout
    .split('\n')
    .some((line) => line.split(' ')[1] === '160000')
}
