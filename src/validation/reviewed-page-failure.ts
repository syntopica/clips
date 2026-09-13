import { committedPageText } from './committed-page-text.ts'
import { isReviewedPage } from './is-reviewed-page.ts'
import type { WorktreeChange } from './worktree-change.ts'

/** Null when this change may land on this page; otherwise why not. Only a
 * modification is judged: an added or untracked path has no committed version
 * to carry the marker, and a page the synthesis wrote itself was never curated.
 */
export const reviewedPageFailure = async (
  worktree: string,
  change: WorktreeChange,
): Promise<string | null> => {
  if (change.kind !== 'modified') return null
  const committed = await committedPageText(worktree, change.path)
  if (committed === null || !isReviewedPage(committed)) return null
  return 'marked reviewed: true, so the pipeline may not edit it'
}
