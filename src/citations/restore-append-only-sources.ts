import { frontmatterListLines } from '../audit/frontmatter-list-lines.ts'
import { pageSources } from '../audit/page-sources.ts'
import { sourceEntryValues } from '../grade/source-entry-values.ts'
import { appendOnlySources } from './append-only-sources.ts'
import { pageClaimRefs } from './page-claim-refs.ts'
import { sourceEntryGroups } from './source-entry-groups.ts'
import { sourcesBlockRange } from './sources-block-range.ts'

/** A rewritten page with its `sources:` list put back to append-only form: the
 * committed entries verbatim and in order, then whatever the rewrite added.
 *
 * Measured 2026-10-05: two of the first three clips the worker ladder wrote on
 * free OpenRouter models were refused because the model reordered the list
 * while copying the page back, although the prose it returned still cited the
 * committed positions and the new clip as `[SNEW]`. Restoring the order is what
 * makes those markers true again, so it is a repair rather than a guess; a
 * rewrite that also renumbered its prose is still caught by the grade. A page
 * with no markers, or whose list already only appended, comes back unchanged. */
export const restoreAppendOnlySources = (
  committed: string,
  proposed: string,
): string => {
  if (pageClaimRefs(proposed).length === 0) return proposed
  const kept = pageSources(committed)
  if (appendOnlySources(kept, pageSources(proposed))) return proposed
  const lines = proposed.split('\n')
  const range = sourcesBlockRange(lines)
  if (range === null) return proposed
  const added = sourceEntryGroups(lines.slice(range.start, range.end)).filter(
    (group) => !sourceEntryValues(group).some((value) => kept.includes(value)),
  )
  const block = [...frontmatterListLines(committed, 'sources'), ...added.flat()]
  return [
    ...lines.slice(0, range.start),
    ...block,
    ...lines.slice(range.end),
  ].join('\n')
}
