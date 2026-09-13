import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { ALLOWED_PAGE_DIRECTORIES } from '../validation/allowed-page-directories.ts'

/** Last-access time in milliseconds for every wiki page in the worktree, keyed
 * by the same relative path validation and the ledger already use.
 *
 * `index.md` is included where `linkedPageIds` excludes it, and the difference
 * is the question being asked: there it is which page links which, and the root
 * map links everything, so counting it would make the orphan check pass for
 * anything. Here it is which page the model opened, and opening the map to find
 * its way around the wiki is a real read and the interesting one. */
export const pageAtimes = async (
  worktree: string,
): Promise<Map<string, number>> => {
  const atimes = new Map<string, number>()
  const index = await stat(join(worktree, 'index.md')).catch(() => null)
  if (index !== null) atimes.set('index.md', index.atimeMs)
  for (const directory of ALLOWED_PAGE_DIRECTORIES) {
    const entries = await readdir(join(worktree, directory)).catch(() => [])
    for (const entry of entries) {
      if (!entry.endsWith('.md')) continue
      const path = `${directory}/${entry}`
      const stats = await stat(join(worktree, path)).catch(() => null)
      if (stats !== null) atimes.set(path, stats.atimeMs)
    }
  }
  return atimes
}
