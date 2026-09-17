import { agyBulkTriage } from './agy-bulk-triage.ts'
import { runTriageCodex } from './run-triage-codex.ts'
import { runTriageWithFallback } from './run-triage-with-fallback.ts'
import type { TriageRunner } from './triage-runner.ts'

/** Pick the bulk classification transport from `runners.triage`, which
 * `CLIPS_TRIAGE_RUNNER` overrides through the configuration loader.
 *
 * An instance that configured none stops with the fix in the message: there is
 * no interactive classifier, and a harvest reads every title it collected, so
 * picking a transport on the owner's behalf is the one thing this stage must
 * not do.
 *
 * `agy-bulk` is what the owner runs, changed from codex on 2026-08-02:
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
 * is why the codex transport still exists.
 *
 * `codex` and `agy-bulk` pin a single transport for a run that must not mix
 * models; `fallback` is the pre-2026-08-02 behaviour, codex first with agy
 * behind it on the credit wall.
 *
 * An unrecognised value throws instead of defaulting. A typo would otherwise
 * run the whole harvest on a transport the caller did not choose. */
export const selectTriageRunner = (name: string | null): TriageRunner => {
  if (name === null || name === 'manual') {
    throw new Error(
      'No triage transport is configured. Set runners.triage in ' +
        'syntopica.config.json to "codex", "agy-bulk" or "fallback", or ' +
        'export CLIPS_TRIAGE_RUNNER for one run.',
    )
  }
  if (name === 'codex') return runTriageCodex
  if (name === 'agy-bulk') return agyBulkTriage
  if (name === 'fallback') return runTriageWithFallback
  throw new Error(
    `Unknown triage runner "${name}" - expected "codex", "agy-bulk" or "fallback".`,
  )
}
