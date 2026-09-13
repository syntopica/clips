import { runGit } from './run-git.ts'

/** Exit 0 means ancestor, exit 1 means not. Anything else is a real failure. */
export const isAncestor = async (
  repository: string,
  ancestor: string,
  descendant: string,
): Promise<boolean> => {
  const result = await runGit(repository, [
    'merge-base',
    '--is-ancestor',
    ancestor,
    descendant,
  ])
  if (result.exitCode > 1)
    throw new Error(`merge-base failed: ${result.stderr.trim()}`)
  return result.exitCode === 0
}
