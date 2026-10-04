import { isAbsolute, join } from 'node:path'
import { runGit } from '../git/run-git.ts'

/** Where run histories live: inside the brain repository's git directory.
 *
 * Not in the working tree, where an untracked file would show in every status
 * of the instance and could be staged by a page commit, and not in the clips
 * store, which is committed and pushed: a run history is this machine's
 * observation, not data the instance shares. The common directory, so an
 * ingest worktree and the main checkout read the same history. Null when the
 * brain is not a git repository, and the caller records nothing. */
export const clipRunsDirectory = async (
  brainRepository: string,
): Promise<string | null> => {
  const result = await runGit(brainRepository, [
    'rev-parse',
    '--git-common-dir',
  ])
  if (result.exitCode !== 0) return null
  const common = result.stdout.trim()
  return join(
    isAbsolute(common) ? common : join(brainRepository, common),
    'clips-runs',
  )
}
