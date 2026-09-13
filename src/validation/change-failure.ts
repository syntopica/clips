import { claimRefFailure } from './claim-ref-failure.ts'
import { contestedRetainedFailure } from './contested-retained-failure.ts'
import { pageContentFailure } from './page-content-failure.ts'
import { pagePathFailure } from './page-path-failure.ts'
import { removedSectionFailure } from './removed-section-failure.ts'
import { reviewedPageFailure } from './reviewed-page-failure.ts'
import { sourceEntryFailure } from './source-entry-failure.ts'
import { sourcesAppendOnlyFailure } from './sources-append-only-failure.ts'
import type { WorktreeChange } from './worktree-change.ts'

/** Null when this change may be committed; otherwise why not. One rule set for
 * every path: a synthesis is confined to the five page directories, may not
 * cross a page marked `reviewed: true`, and must carry the frontmatter
 * SCHEMA.md requires.
 *
 * `index.md` had its own rule set until 2026-08-03, when it stopped being
 * something a synthesizer writes. The root map is now derived by
 * `regenerateIndexMap` as a trusted step, so a synthesis that touches it is
 * refused here like any other file outside the allowlist.
 *
 * The last two arrived with the claim-level citation gate the same day, and
 * both are silent on a page written before the scheme: a marker must name a
 * source the page has, and a page carrying markers may only append to its
 * `sources:` list. Content comes before them so a symlink or a binary is named
 * as what it is rather than as a page with no markers. `sourceEntryFailure`
 * sits between content and the citation pair: an entry that opens with a claim
 * marker corrupts the position of every entry after it, so it is named as the
 * cause before the positional fallout is.
 *
 * The last is the supersession rule and is silent for the same kind of reason:
 * a page with no `## Contested` section has no superseded belief to lose, which
 * is every page today. It runs after the citation pair because a page that
 * cannot satisfy them is refused whatever it did with its history.
 *
 * `removedSectionFailure` comes last of all, and deliberately: dropping a
 * `## Contested` section is a removed section too, and the supersession rule
 * names what was actually lost. The general check is the net under it. */
export const changeFailure = async (
  worktree: string,
  change: WorktreeChange,
): Promise<string | null> =>
  pagePathFailure(change.path) ??
  (await reviewedPageFailure(worktree, change)) ??
  (await pageContentFailure(worktree, change.path)) ??
  (await sourceEntryFailure(worktree, change.path)) ??
  (await claimRefFailure(worktree, change.path)) ??
  (await sourcesAppendOnlyFailure(worktree, change)) ??
  (await contestedRetainedFailure(worktree, change)) ??
  (await removedSectionFailure(worktree, change))
