import { readdir } from 'node:fs/promises'
import { join, posix } from 'node:path'
import { currentWikiLayout } from '../layout/current-wiki-layout.ts'
import { wikiDirectory } from '../layout/wiki-directory.ts'

/** Every synthesized page in the wiki, as page paths (relative to the page
 * root, the spelling ledgers and wikilinks use).
 *
 * Scoped to the configured page directories, which keeps the schema, the
 * backlog, `docs/` and the tool trees out of a report about pages. A missing
 * directory is normal - not every wiki has `people/` - and is skipped rather
 * than raised. */
export const wikiPages = async (brainRepository: string): Promise<string[]> => {
  const pages: string[] = []
  const root = wikiDirectory(brainRepository)
  for (const directory of [...currentWikiLayout().pageDirectories].sort()) {
    const entries = await readdir(join(root, directory), {
      withFileTypes: true,
      recursive: true,
    }).catch(() => [])
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue
      const nested = entry.parentPath.slice(join(root, directory).length)
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
