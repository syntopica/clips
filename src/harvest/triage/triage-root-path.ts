import { join } from 'node:path'
import { wikiDirectory } from '../../layout/wiki-directory.ts'

/** Where the dated triage runs live. The brain's `inbox/` is gitignored on
 * purpose: it is a drop zone the user reads and then empties, not a wiki
 * page. It sits under the page root, not the repository root: once the wiki
 * moved under `brain/` the root-relative path wrote runs to an untracked,
 * unignored `inbox/` beside it and the window start no longer saw the earlier
 * runs (found 2026-10-05). */
export const triageRootPath = (brainRepository: string): string =>
  join(wikiDirectory(brainRepository), 'inbox', 'newsletter-triage')
