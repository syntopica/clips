import { cp } from 'node:fs/promises'
import { join } from 'node:path'
import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'

/** Copy the given inbox-relative clip directories into the archive at the
 * same relative path and stage them. A copy, not a move: the inbox keeps its
 * files until the archive's commit has been pushed, so a rejected push can
 * rewind and re-apply without having lost the only copy. */
export const copyClipsIntoArchive = async (
  inbox: string,
  clipsRepository: string,
  paths: readonly string[],
): Promise<void> => {
  for (const path of paths)
    await cp(join(inbox, path), join(clipsRepository, path), {
      recursive: true,
      errorOnExist: true,
      force: false,
    })
  const add = await runGit(clipsRepository, ['add', '--', ...paths])
  if (add.exitCode !== 0)
    throw new GitFailedError(['add'], add.exitCode, add.stderr)
}
