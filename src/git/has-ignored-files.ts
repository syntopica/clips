import { runGit } from './run-git.ts'
import { splitNul } from './split-nul.ts'

/** Whether the working tree holds ignored files. `add -A` leaves them out of
 * any commit, so a checkout that has some cannot be rebuilt from one. */
export const hasIgnoredFiles = async (repository: string): Promise<boolean> => {
  const result = await runGit(repository, [
    'ls-files',
    '--others',
    '--ignored',
    '--exclude-standard',
    '-z',
  ])
  return splitNul(result.stdout).length > 0
}
