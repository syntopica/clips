import { runGit } from '../git/run-git.ts'

/** The page as HEAD carries it, or null when HEAD does not carry it at all - a
 * page the synthesis created, or a repository with no commits yet.
 *
 * `git show` rather than a read of the worktree file, because the worktree copy
 * is what the synthesizer just wrote: judging the curated-page marker on it
 * would let the same change delete the marker and the boundary together.
 */
export const committedPageText = async (
  worktree: string,
  path: string,
): Promise<string | null> => {
  const result = await runGit(worktree, ['show', `HEAD:${path}`])
  return result.exitCode === 0 ? result.stdout : null
}
