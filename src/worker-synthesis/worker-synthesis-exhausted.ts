import type { SynthesisResult } from '../synthesis/synthesis-result.ts'
import type { SynthesizerIdentity } from '../synthesis/synthesizer-identity.ts'

/** A clip the worker could not synthesize because its ladder was spent, not
 * because of anything in the clip: left pending with nothing written, and the
 * run told to stop (2026-10-05: once OpenRouter's shared free cap was gone,
 * every writing prompt fell to the 40,960-token local model and each clip
 * burned about 25 minutes before escalating). */
export const workerSynthesisExhausted = (
  reason: string,
  identity: SynthesizerIdentity,
): SynthesisResult => ({
  pagesTouched: [],
  needsClaude: false,
  skipped: true,
  exhausted: true,
  reason,
  identity,
})
