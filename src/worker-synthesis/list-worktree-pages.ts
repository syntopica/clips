import { readdir } from 'node:fs/promises'
import { join, posix } from 'node:path'

/** Every markdown page under the page directories, as repository paths.
 *
 * Handed to the writing pass so its wikilinks name pages that exist - the
 * model sees only the pages it is rewriting, and a link it guesses resolves to
 * nothing. A directory that is not there contributes nothing. */
export const listWorktreePages = async (
  worktree: string,
  directories: readonly string[],
): Promise<string[]> => {
  const pages: string[] = []
  for (const directory of directories) {
    const entries = await readdir(join(worktree, directory), {
      recursive: true,
    }).catch(() => [])
    for (const entry of entries)
      if (entry.endsWith('.md'))
        pages.push(posix.join(directory, entry.split('\\').join('/')))
  }
  return pages.sort()
}
