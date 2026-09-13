import type { Clip } from '../clips/clip.ts'
import type { ClipOutcome } from './clip-outcome.ts'
import { regenerateIndexMap } from './regenerate-index-map.ts'
import type { Repositories } from './repositories.ts'
import { rewriteClaimMarkers } from './rewrite-claim-markers.ts'

/** The two steps that run on a validated worktree before the reviewer sees it:
 * claim markers become links, then `index.md` is derived from what survived.
 *
 * The marker rewrite runs first because the root map is built from each page's
 * `summary:`, which carries no markers - the order costs nothing either way and
 * reads in pipeline order. Both are here rather than in publication so the
 * reviewer approves the text that actually gets committed. */
export const deriveWorktreePages = async (
  repositories: Repositories,
  clip: Clip,
  worktree: string,
  paths: string[],
): Promise<{ paths: string[] } | { outcome: ClipOutcome }> => {
  const rewritten = await rewriteClaimMarkers(
    repositories,
    clip,
    worktree,
    paths,
  )
  if ('outcome' in rewritten) return rewritten
  return regenerateIndexMap(repositories, clip, worktree, paths)
}
