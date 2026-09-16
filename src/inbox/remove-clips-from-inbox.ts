import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'

/** Stage the removal of clip directories the archive now holds. */
export const removeClipsFromInbox = async (
  inbox: string,
  paths: readonly string[],
): Promise<void> => {
  const rm = await runGit(inbox, ['rm', '-r', '-q', '--', ...paths])
  if (rm.exitCode !== 0)
    throw new GitFailedError(['rm'], rm.exitCode, rm.stderr)
}
