import { agyBulkTriage } from './agy-bulk-triage.ts'
import { runTriageCodex } from './run-triage-codex.ts'
import { runTriageWithFallback } from './run-triage-with-fallback.ts'
import type { TriageRunner } from './triage-runner.ts'

/** Pick the bulk classification transport from `CLIPS_TRIAGE_RUNNER`.
 *
 * Unset means agy, changed from codex on 2026-08-02 at the owner's direction:
 * codex empties its workspace credits long before agy exhausts its quota, and
 * this stage reads every harvested title, so it is where that difference gets
 * paid. codex is not gone, it moved - `selectTriageRefiner` spends it on the
 * uncertain tail, which is a fraction of the corpus.
 *
 * The cost of the flip is written down rather than hidden: codex went first
 * because it is the confined one - `-s read-only`, no network - and the input
 * is untrusted titles harvested from the open web, while agy has no sandbox
 * flag at all. The bulk pass now runs on the weaker boundary against a
 * prompt-injection payload hidden in a title. What limits the damage is
 * unchanged - an id outside the article range is dropped, and a verdict can
 * only move an article between three buckets - but the exposure is real, and it
 * is why `CLIPS_TRIAGE_RUNNER=codex` still exists.
 *
 * `codex` and `agy` pin a single transport for a run that must not mix models;
 * `fallback` is the pre-2026-08-02 default, codex first with agy behind it on
 * the credit wall.
 *
 * An unrecognised value throws instead of defaulting. A typo in the variable
 * would otherwise run the whole harvest on a transport the caller did not
 * choose. */
export const selectTriageRunner = (name: string | undefined): TriageRunner => {
  if (name === undefined) return agyBulkTriage
  if (name === 'codex') return runTriageCodex
  if (name === 'agy') return agyBulkTriage
  if (name === 'fallback') return runTriageWithFallback
  throw new Error(
    `Unknown CLIPS_TRIAGE_RUNNER "${name}" - expected "codex", "agy" or "fallback".`,
  )
}
