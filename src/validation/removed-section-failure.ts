import { modifiedPageTexts } from './modified-page-texts.ts'
import { pageHeadings } from './page-headings.ts'
import type { WorktreeChange } from './worktree-change.ts'

/** Null when this change keeps every section the page already had; otherwise
 * which ones it dropped.
 *
 * An ingest adds what one source taught to what the wiki already knows. SCHEMA
 * is explicit that new data contradicting an existing claim is noted as a
 * contradiction rather than written over, so removing a whole section is never
 * what integrating a clip looks like - and when a synthesis does it anyway,
 * nothing downstream notices. The diff is mostly insertions, the counts look
 * healthy, and the reviewer reads a plausible addition.
 *
 * Measured 2026-08-08 across fifteen abandoned syntheses: five had deleted
 * curated prose that was not re-added anywhere, the worst taking eleven lines
 * of `topics/launch-checklists.md` with it - the entire WordPress/Elementor
 * checklist, including the most common disastrous launch-day mistake. None of
 * them reached the wiki, but only because those clips happened to fail for
 * unrelated reasons.
 *
 * Judged on headings rather than on prose, and on the committed page rather
 * than the worktree copy, for the reason `sourcesAppendOnlyFailure` gives.
 * Headings are the part of a page whose disappearance is unambiguous: prose
 * gets reworded and reflowed by prettier constantly, so a line-level test would
 * fire on every ordinary edit, which is the always-fires shape this repository
 * has switched off before. A paragraph swapped for another of similar length
 * inside a surviving section still gets through here; that one is the review
 * gate's to catch, and its criteria now name it. */
export const removedSectionFailure = async (
  worktree: string,
  change: WorktreeChange,
): Promise<string | null> => {
  const texts = await modifiedPageTexts(worktree, change)
  if (texts === null) return null
  const kept = new Set(pageHeadings(texts.current))
  const dropped = pageHeadings(texts.committed).filter(
    (heading) => !kept.has(heading),
  )
  return dropped.length === 0
    ? null
    : `it removes ${String(dropped.length)} section(s) the page already had: ${dropped.slice(0, 3).join(' / ')}. An ingest adds to what the wiki knows; a contradiction is noted, not written over`
}
