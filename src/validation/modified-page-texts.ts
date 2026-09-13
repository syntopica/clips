import { committedPageText } from './committed-page-text.ts'
import { readPageText } from './read-page-text.ts'
import type { WorktreeChange } from './worktree-change.ts'

/** The committed and current text of a modified page, or null when the
 * change is not a modification, the page has no committed version, or its
 * current text cannot be read - each of which is nothing for a same-page
 * comparison to judge. */
export const modifiedPageTexts = async (
  worktree: string,
  change: WorktreeChange,
): Promise<{ committed: string; current: string } | null> => {
  if (change.kind !== 'modified') return null
  const committed = await committedPageText(worktree, change.path)
  if (committed === null) return null
  const result = await readPageText(worktree, change.path)
  if (!result.ok) return null
  return { committed, current: result.text }
}
