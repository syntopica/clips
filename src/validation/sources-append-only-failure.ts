import { pageSources } from '../audit/page-sources.ts'
import { appendOnlySources } from '../citations/append-only-sources.ts'
import { pageClaimRefs } from '../citations/page-claim-refs.ts'
import { modifiedPageTexts } from './modified-page-texts.ts'
import type { WorktreeChange } from './worktree-change.ts'

/** Null when this change may reorder nothing; otherwise why not.
 *
 * Judged on the committed page for the reason `reviewedPageFailure` gives: the
 * worktree copy is what the synthesizer just wrote, so comparing it against
 * itself would let one change move a source and rewrite the marker pointing at
 * it in the same breath, which is precisely the silent reattribution the rule
 * exists to stop.
 *
 * Only a modification is judged - a created page has no committed list to
 * preserve - and only when the page carries markers, because a list with no
 * positions pointing into it can be reordered freely. That is every page in the
 * wiki today, so this refuses nothing until the scheme is in use. */
export const sourcesAppendOnlyFailure = async (
  worktree: string,
  change: WorktreeChange,
): Promise<string | null> => {
  const texts = await modifiedPageTexts(worktree, change)
  if (texts === null) return null
  if (pageClaimRefs(texts.current).length === 0) return null
  return appendOnlySources(
    pageSources(texts.committed),
    pageSources(texts.current),
  )
    ? null
    : 'sources: was reordered or shortened; on a page carrying claim markers it is append-only, because every marker points at a position'
}
