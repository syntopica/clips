import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { currentWikiLayout } from '../layout/current-wiki-layout.ts'
import { wikiDirectory } from '../layout/wiki-directory.ts'

/** Last-access time in milliseconds for every wiki page in the worktree, keyed
 * by page path - the spelling every ledger's `pagesRead` has always used.
 *
 * The index is included where `linkedPageIds` excludes it, and the difference
 * is the question being asked: there it is which page links which, and the root
 * map links everything, so counting it would make the orphan check pass for
 * anything. Here it is which page the model opened, and opening the map to find
 * its way around the wiki is a real read and the interesting one. */
export const pageAtimes = async (
  worktree: string,
): Promise<Map<string, number>> => {
  const atimes = new Map<string, number>()
  const layout = currentWikiLayout()
  const root = wikiDirectory(worktree)
  const index = await stat(join(root, layout.index)).catch(() => null)
  if (index !== null) atimes.set(layout.index, index.atimeMs)
  for (const directory of layout.pageDirectories) {
    const entries = await readdir(join(root, directory)).catch(() => [])
    for (const entry of entries) {
      if (!entry.endsWith('.md')) continue
      const path = `${directory}/${entry}`
      const stats = await stat(join(root, path)).catch(() => null)
      if (stats !== null) atimes.set(path, stats.atimeMs)
    }
  }
  return atimes
}
