import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { currentWikiLayout } from '../layout/current-wiki-layout.ts'
import { selectedPageCandidates } from './selected-page-candidates.ts'
import { workerPagePathRefusal } from './worker-page-path-refusal.ts'
import type { WorkerShownPage } from './worker-shown-page.ts'

/** The pages the selection pass named, read whole from the worktree.
 *
 * A name is resolved through `selectedPageCandidates`, and one that resolves
 * to no existing page is dropped rather than failing the clip: a model
 * misremembering a slug from the index is common and harmless, since the
 * writing pass may still create a page and the validator refuses one nothing
 * links to. */
export const readShownPages = async (
  worktree: string,
  names: readonly string[],
  directories: readonly string[],
): Promise<WorkerShownPage[]> => {
  const shown: WorkerShownPage[] = []
  const { pageRoot } = currentWikiLayout()
  for (const name of names)
    for (const path of selectedPageCandidates(name, pageRoot)) {
      if (workerPagePathRefusal(path, directories) !== null) continue
      if (shown.some((page) => page.path === path)) break
      const content = await readFile(join(worktree, path), 'utf8').catch(
        () => null,
      )
      if (content === null) continue
      shown.push({ path, content })
      break
    }
  return shown
}
