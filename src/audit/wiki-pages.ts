import { readdir } from 'node:fs/promises'
import { join, posix } from 'node:path'
import { ALLOWED_PAGE_DIRECTORIES } from '../validation/allowed-page-directories.ts'

/** Every synthesized page in the wiki, as repository-relative posix paths.
 *
 * Scoped to the directories a synthesizer is allowed to write, which keeps
 * `SCHEMA.md`, `TODO.md`, `docs/` and the tool trees out of a report about
 * pages. A missing directory is normal - not every wiki has `people/` - and is
 * skipped rather than raised. */
export const wikiPages = async (brainRepository: string): Promise<string[]> => {
  const pages: string[] = []
  for (const directory of [...ALLOWED_PAGE_DIRECTORIES].sort()) {
    const entries = await readdir(join(brainRepository, directory), {
      withFileTypes: true,
      recursive: true,
    }).catch(() => [])
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue
      const nested = entry.parentPath.slice(
        join(brainRepository, directory).length,
      )
      pages.push(
        posix.join(
          directory,
          ...nested.split(/[/\\]/).filter(Boolean),
          entry.name,
        ),
      )
    }
  }
  return pages.sort()
}
