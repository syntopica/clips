import type { SynthesisResult } from '../synthesis/synthesis-result.ts'
import type { SynthesizerIdentity } from '../synthesis/synthesizer-identity.ts'

/** A clip whose worker job lost its executor mid-run: left pending with
 * nothing written, and unlike an exhausted ladder the run goes on, because the
 * next clip's job can still find a node. Escalating it instead parked the clip
 * in needs-claude as though a model had refused it. */
export const workerSynthesisInterrupted = (
  reason: string,
  identity: SynthesizerIdentity,
): SynthesisResult => ({
  pagesTouched: [],
  needsClaude: false,
  skipped: true,
  reason,
  identity,
})
