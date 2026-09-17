import { agyBulkTriage } from './agy-bulk-triage.ts'
import { agyFineTriage } from './agy-fine-triage.ts'
import { runRefineWithFallback } from './run-refine-with-fallback.ts'
import { runTriageCodex } from './run-triage-codex.ts'
import type { TriageRunner } from './triage-runner.ts'

/** Pick the refinement transport from `runners.triageRefiner`, which
 * `CLIPS_TRIAGE_REFINER` overrides through the configuration loader.
 *
 * Unset is the one stage where nothing configured means nothing run: the
 * refinement pass is a second opinion on the uncertain tail, so an instance
 * that named no transport gets the single-stage harvest rather than a model it
 * never chose. `fallback` means codex with Claude-through-agy behind it - both
 * fine tier, by the
 * standing rule that volume goes to Gemini and judgement goes to codex or to
 * agy's Anthropic and OpenAI models. codex leads because it is the confined
 * one; reading only the uncertain tail is what makes a quota that empties fast
 * affordable at all.
 *
 * `agy-bulk` puts refinement back on Gemini, which is only worth doing when
 * every fine quota is gone - a second opinion from the same model that produced
 * the first is barely a second opinion.
 *
 * `off` says the same thing deliberately, for an instance that configured the
 * other stages and wants this one skipped while the codex workspace is walled.
 * An unrecognised value throws rather than defaulting, so a typo cannot
 * silently drop the second pass. */
export const selectTriageRefiner = (
  name: string | null,
): TriageRunner | null => {
  if (name === null || name === 'off' || name === 'manual') return null
  if (name === 'fallback') return runRefineWithFallback
  if (name === 'codex') return runTriageCodex
  if (name === 'agy-fine') return agyFineTriage
  if (name === 'agy-bulk') return agyBulkTriage
  throw new Error(
    `Unknown triage refiner "${name}" - expected "codex", "agy-fine", "agy-bulk", "fallback" or "off".`,
  )
}
