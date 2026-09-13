import { agyBulkTriage } from './agy-bulk-triage.ts'
import { agyFineTriage } from './agy-fine-triage.ts'
import { runRefineWithFallback } from './run-refine-with-fallback.ts'
import { runTriageCodex } from './run-triage-codex.ts'
import type { TriageRunner } from './triage-runner.ts'

/** Pick the refinement transport from `CLIPS_TRIAGE_REFINER`.
 *
 * Unset means codex with Claude-through-agy behind it - both fine tier, by the
 * standing rule that volume goes to Gemini and judgement goes to codex or to
 * agy's Anthropic and OpenAI models. codex leads because it is the confined
 * one; reading only the uncertain tail is what makes a quota that empties fast
 * affordable at all.
 *
 * `agy-bulk` puts refinement back on Gemini, which is only worth doing when
 * every fine quota is gone - a second opinion from the same model that produced
 * the first is barely a second opinion.
 *
 * `off` runs the harvest on the bulk pass alone - the single-stage behaviour,
 * and the right choice when the codex workspace is walled. An unrecognised
 * value throws rather than defaulting, so a typo cannot silently drop the
 * second pass. */
export const selectTriageRefiner = (
  name: string | undefined,
): TriageRunner | null => {
  if (name === undefined) return runRefineWithFallback
  if (name === 'fallback') return runRefineWithFallback
  if (name === 'codex') return runTriageCodex
  if (name === 'agy-fine') return agyFineTriage
  if (name === 'agy-bulk') return agyBulkTriage
  if (name === 'off') return null
  throw new Error(
    `Unknown CLIPS_TRIAGE_REFINER "${name}" - expected "codex", "agy-fine", "agy-bulk", "fallback" or "off".`,
  )
}
