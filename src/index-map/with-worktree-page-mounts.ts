import { cp, mkdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { missingWorktreePageDirectories } from './missing-worktree-page-directories.ts'

/** Run `body` with every page directory the worktree lacks copied in from the
 * data directory, and take the copies away afterwards whatever happened.
 *
 * The index builder reads each configured page directory and treats a missing
 * one as empty. When the instance mounted a shared brain on 2026-11-24, every
 * ingest worktree therefore rebuilt the index without the mount's twelve
 * entries, and the review gate escalated each clip for dropping them.
 *
 * A copy, not a link: the builder resolves every page directory and refuses
 * one that leaves the data directory, which a link into the instance does. The
 * copies exist only while the builder runs, like the engine pin beside them,
 * so the synthesizer never sees pages another repository owns. */
export const withWorktreePageMounts = async <T>(
  dataRoot: string,
  pages: readonly string[],
  worktree: string,
  body: () => Promise<T>,
): Promise<T> => {
  const created: string[] = []
  try {
    for (const path of missingWorktreePageDirectories(
      dataRoot,
      pages,
      worktree,
    )) {
      const target = join(worktree, path)
      created.push(
        (await mkdir(dirname(target), { recursive: true })) ?? target,
      )
      await cp(join(dataRoot, path), target, { recursive: true })
    }
    return await body()
  } finally {
    for (const path of created) await rm(path, { recursive: true, force: true })
  }
}
