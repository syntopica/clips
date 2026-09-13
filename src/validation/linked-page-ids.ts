import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ALLOWED_PAGE_DIRECTORIES } from './allowed-page-directories.ts'
import { pageId } from './page-id.ts'
import { wikilinkTargets } from './wikilink-targets.ts'

/** Every page id some page in the worktree links to, keyed by the page that
 * links it, so a caller can tell a genuine inbound link from a page's own
 * self-reference.
 *
 * `index.md` is not read, and that is the rule rather than an oversight: the
 * root map lists every page by construction, so counting it as an inbound link
 * would make the orphan check pass for everything. It is the same exclusion
 * `tools/graph/build.py` makes, and why a hub reachable only from the index
 * still counts as an orphan there. */
export const linkedPageIds = async (
  worktree: string,
): Promise<Map<string, Set<string>>> => {
  const links = new Map<string, Set<string>>()
  for (const directory of ALLOWED_PAGE_DIRECTORIES) {
    const entries = await readdir(join(worktree, directory)).catch(() => [])
    for (const entry of entries) {
      if (!entry.endsWith('.md')) continue
      const path = `${directory}/${entry}`
      const text = await readFile(join(worktree, path), 'utf8').catch(() => '')
      for (const target of wikilinkTargets(text)) {
        const linkers = links.get(target) ?? new Set<string>()
        linkers.add(pageId(path))
        links.set(target, linkers)
      }
    }
  }
  return links
}
