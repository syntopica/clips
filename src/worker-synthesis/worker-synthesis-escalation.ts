import type { SynthesisResult } from '../synthesis/synthesis-result.ts'
import type { SynthesizerIdentity } from '../synthesis/synthesizer-identity.ts'

/** A clip the worker could not synthesize, routed to needs-claude with its
 * evidence and nothing written to the brain. */
export const workerSynthesisEscalation = (
  reason: string,
  identity: SynthesizerIdentity,
): SynthesisResult => ({
  pagesTouched: [],
  needsClaude: true,
  skipped: false,
  reason,
  identity,
})
