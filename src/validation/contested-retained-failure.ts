import { pageContestedBeliefs } from '../audit/page-contested-beliefs.ts'
import { modifiedPageTexts } from './modified-page-texts.ts'
import type { WorktreeChange } from './worktree-change.ts'

/** Null when this change keeps every contested entry the committed page
 * carried; otherwise which ones it dropped.
 *
 * The teeth of the supersession convention. A prompt can ask a synthesizer to
 * move a replaced belief into `## Contested` instead of overwriting it, and
 * nothing about that survives the one run that does not - the sentence is gone
 * from the working tree and the only trace is a diff nobody re-reads. Checked
 * here, the run fails and the brain is untouched, which is what every other
 * validation failure already does.
 *
 * Retention rather than append-only, and the difference from
 * `sourcesAppendOnlyFailure` is what the positions mean. A `sources:` entry is
 * pointed at by markers, so its index matters and a reorder is a silent
 * reattribution; a contested entry is pointed at by nothing, so a run may sort
 * the section or interleave a new entry freely. What it may not do is lose one.
 *
 * Judged against the committed page for `reviewedPageFailure`'s reason: the
 * worktree copy is what the synthesizer just wrote, so comparing it with itself
 * would let one change delete a belief and its own record of the deletion
 * together. Only a modification is judged - a created page has no history to
 * keep - and a page with no contested section is silent, which is every page in
 * the wiki today. */
export const contestedRetainedFailure = async (
  worktree: string,
  change: WorktreeChange,
): Promise<string | null> => {
  const texts = await modifiedPageTexts(worktree, change)
  if (texts === null) return null
  const kept = new Set(pageContestedBeliefs(texts.current))
  const dropped = pageContestedBeliefs(texts.committed).filter(
    (entry) => !kept.has(entry),
  )
  return dropped.length === 0
    ? null
    : `## Contested lost ${String(dropped.length)} entry(ies), starting "${dropped[0]?.slice(0, 60) ?? ''}"; a superseded belief is kept, never overwritten`
}
