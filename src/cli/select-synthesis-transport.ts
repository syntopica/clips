import { agyBulkSynthesizer } from '../agy/agy-bulk-synthesizer.ts'
import { agyFineSynthesizer } from '../agy/agy-fine-synthesizer.ts'
import { synthesizeWithFallback } from '../agy/synthesize-with-fallback.ts'
import { codexSynthesizer } from '../codex/codex-synthesizer.ts'
import { runCodexExec } from '../codex/run-codex-exec.ts'
import { cursorFineSynthesizer } from '../cursor/cursor-fine-synthesizer.ts'
import type { Synthesizer } from '../synthesis/synthesizer.ts'

/** Pick the unattended synthesis transport from `CLIPS_SYNTHESIS_RUNNER`.
 *
 * Unset means Claude through agy with Gemini behind it on the quota wall,
 * decided by the owner on 2026-08-02 and widened on 2026-08-03 once the fine
 * quota proved to last about two clips. `agy-fine` and `agy-bulk` pin one model
 * and degrade rather than switching; `codex` pins the old transport, for a
 * workspace with credits.
 *
 * An unrecognised value throws rather than defaulting, so a typo cannot quietly
 * move synthesis to a model the caller did not choose - the same rule the grade
 * and triage selectors follow.
 *
 * **The pair must stay split**, and since 2026-08-03 the code enforces it
 * rather than the prose: `fallbackGraderAfterCodex` reads this same variable
 * and refuses to grade on a model the synthesis transport may have used. Pin
 * `CLIPS_GRADE_RUNNER` to `codex` where credits allow; unpinned and with codex
 * walled, grading now stops with an actionable error instead of quietly letting
 * the author verify itself. */
export const selectSynthesisTransport = (
  name: string | undefined,
): Synthesizer => {
  if (name === undefined) return synthesizeWithFallback
  if (name === 'fallback') return synthesizeWithFallback
  if (name === 'agy') return synthesizeWithFallback
  if (name === 'agy-fine') return agyFineSynthesizer
  if (name === 'agy-bulk') return agyBulkSynthesizer
  if (name === 'codex') return codexSynthesizer(runCodexExec)
  if (name === 'cursor') return cursorFineSynthesizer
  throw new Error(
    `Unknown CLIPS_SYNTHESIS_RUNNER "${name}" - expected "codex", "cursor", "agy-fine", "agy-bulk" or "fallback".`,
  )
}
