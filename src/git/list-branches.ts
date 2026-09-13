import { runGit } from './run-git.ts'

export const listBranches = async (
  repository: string,
  prefix: string,
): Promise<string[]> => {
  const result = await runGit(repository, [
    'for-each-ref',
    '--format=%(refname:short)',
    `refs/heads/${prefix}`,
  ])
  return result.stdout.split('\n').filter(Boolean)
}
