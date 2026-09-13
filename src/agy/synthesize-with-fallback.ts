import type { Synthesizer } from '../synthesis/synthesizer.ts'
import { agyBulkSynthesizer } from './agy-bulk-synthesizer.ts'
import { agyFineSynthesizer } from './agy-fine-synthesizer.ts'
import { isAgyQuotaExhausted } from './is-agy-quota-exhausted.ts'

/** Claude through agy first, Gemini behind it when that family's quota is
 * spent.
 *
 * Synthesis is fine-tier work by the standing rule, so Claude leads: it writes
 * the page a human then approves, and nothing downstream rewrites it. But the
 * fine quota is small - measured 2026-08-03, roughly two unattended syntheses
 * emptied it - and Gemini's is a separate pool that was answering normally in
 * the same minute. A batch that stops after two clips is worse than one whose
 * third clip is written by the cheaper model and reviewed by the same human.
 *
 * The trigger is narrow, the same rule the grade and triage fallbacks follow:
 * only the quota wall switches models, because it is the one failure no retry
 * clears. A timeout, an escalation, or an unparseable envelope stays a failure
 * on the first model and routes the clip to needs-claude, rather than being
 * quietly re-answered by a different one.
 *
 * The switch is announced. Two models do not write the same page, and the
 * operator is about to approve a diff without being told which wrote it
 * otherwise.
 */
export const synthesizeWithFallback: Synthesizer = {
  synthesize: async (input) => {
    const fine = await agyFineSynthesizer.synthesize(input)
    if (!isAgyQuotaExhausted(fine.reason)) return fine
    process.stderr.write(
      "agy's Claude quota is spent - synthesizing with Gemini instead. " +
        'Pin one with CLIPS_SYNTHESIS_RUNNER.\n',
    )
    return agyBulkSynthesizer.synthesize(input)
  },
}
