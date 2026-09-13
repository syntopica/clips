import type { Clip } from '../clips/clip.ts'
import { generateIndexMap } from '../index-map/generate-index-map.ts'
import { indexMapChanged } from '../index-map/index-map-changed.ts'
import { routeToNeedsClaude } from '../reconcile/route-to-needs-claude.ts'
import { formatWorktreePages } from '../validation/format-worktree-pages.ts'
import { INDEX_PAGE_PATH } from '../validation/index-page-path.ts'
import type { ClipOutcome } from './clip-outcome.ts'
import type { Repositories } from './repositories.ts'

/** Step 7b: derive the root map from the pages the synthesis just validated,
 * and add it to the set the reviewer sees and the committer stages.
 *
 * Between validation and the review gate on purpose. Everything that can fail
 * here - a missing `python3`, a script error, prose prettier cannot format -
 * fails before a human approves anything, and leaves the brain untouched the
 * same way a validation failure does. */
export const regenerateIndexMap = async (
  repositories: Repositories,
  clip: Clip,
  worktree: string,
  paths: string[],
): Promise<{ paths: string[] } | { outcome: ClipOutcome }> => {
  const failure = await generateIndexMap(worktree)
  if (failure !== null) {
    await routeToNeedsClaude(repositories.clips, clip, {
      stage: 'validation',
      code: 'INDEX_MAP_FAILED',
      message: failure,
    })
    return { outcome: 'needs-claude' }
  }
  if (!(await indexMapChanged(worktree))) return { paths }
  const formatFailure = await formatWorktreePages(
    repositories.brain,
    worktree,
    [INDEX_PAGE_PATH],
  )
  if (formatFailure !== null) {
    await routeToNeedsClaude(repositories.clips, clip, {
      stage: 'validation',
      code: 'INDEX_MAP_FAILED',
      message: formatFailure,
    })
    return { outcome: 'needs-claude' }
  }
  return { paths: [...paths, INDEX_PAGE_PATH].sort() }
}
