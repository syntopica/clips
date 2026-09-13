import { runGit } from './run-git.ts'
import { splitNul } from './split-nul.ts'

export const isWorkingTreeClean = async (
  repository: string,
): Promise<boolean> => {
  const result = await runGit(repository, ['status', '--porcelain=v2', '-z'])
  return splitNul(result.stdout).length === 0
}
