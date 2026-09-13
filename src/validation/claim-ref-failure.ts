import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pageSources } from '../audit/page-sources.ts'
import { pageClaimRefs } from '../citations/page-claim-refs.ts'
import { resolveNewSourceMarker } from '../citations/resolve-new-source-marker.ts'
import { unresolvedClaimRefs } from '../citations/unresolved-claim-refs.ts'
import { readPageText } from './read-page-text.ts'

/** Null when every marker on this page names a source the page has; otherwise
 * which ones do not.
 *
 * The gate half of the claim-level citation scheme. `clips audit` reports the
 * same shortfall over the whole wiki and cannot do anything about it; here it
 * refuses the synthesis, and a refusal leaves the brain untouched as every
 * validation failure already does.
 *
 * What it does **not** check is whether a claim carries a marker at all. That
 * would fire on every grandfathered page an ingest merely edits, which is the
 * always-fires shape this repository has switched off once. The prompt asks for
 * markers; validation only holds them to meaning something.
 *
 * It resolves `[SNEW]` before judging. That marker is how a synthesis says "the
 * source I just appended" without counting a list that can be 121 entries long,
 * and counting is what the model got wrong twice in eleven clips on 2026-08-08.
 * The substitution happens here rather than in a pass of its own because this
 * is the step that already reads every page and knows what a marker must mean,
 * and because `pagePathFailure` has run before it in the same chain - so the
 * path is known safe before anything is written back.
 *
 * A page whose file has already disqualified itself - a symlink, a binary, an
 * oversized blob - is left to `pageContentFailure`, which runs after this in the
 * same chain and names the real problem. */
export const claimRefFailure = async (
  worktree: string,
  path: string,
): Promise<string | null> => {
  const result = await readPageText(worktree, path)
  if (!result.ok) return null
  const text = resolveNewSourceMarker(result.text)
  if (text !== result.text) await writeFile(join(worktree, path), text)
  const unresolved = unresolvedClaimRefs(pageClaimRefs(text), pageSources(text))
  return unresolved.length === 0
    ? null
    : `${unresolved.join(', ')} names no entry in this page's sources: list`
}
