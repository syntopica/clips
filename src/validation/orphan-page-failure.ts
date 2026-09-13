import { ALLOWED_PAGE_DIRECTORIES } from './allowed-page-directories.ts'
import { linkedPageIds } from './linked-page-ids.ts'
import { pageId } from './page-id.ts'

/** SCHEMA's connect-or-shelve rule, checked instead of discovered.
 *
 * A page nothing links to is unreachable by the five-page query discipline the
 * wiki is read with, so it may as well not be there. The rule has existed since
 * the wiki did, and batches 12, 13 and 14 each shipped a page that broke it -
 * every one caught days later by the orphan count in `tools/graph/build.py`,
 * after the commit. This is the same rule at the gate, where it costs a
 * cross-link rather than a follow-up batch.
 *
 * Only pages this synthesis created are checked. An existing page that lost its
 * last inbound link is a different problem, and failing an unrelated clip for it
 * would be the always-fires check this repo has already switched off once. A
 * link from the page to itself does not count, and neither does one from
 * `index.md` - see `linkedPageIds`. */
export const orphanPageFailure = async (
  worktree: string,
  createdPaths: readonly string[],
): Promise<string | null> => {
  const created = createdPaths.filter((path) =>
    ALLOWED_PAGE_DIRECTORIES.has(path.split('/')[0] ?? ''),
  )
  if (created.length === 0) return null
  const links = await linkedPageIds(worktree)
  for (const path of created) {
    const id = pageId(path)
    const linkers = [...(links.get(id) ?? [])].filter((linker) => linker !== id)
    if (linkers.length === 0)
      return `${path}: no other page links to it - cross-link it from the page it serves, or shelve it`
  }
  return null
}
