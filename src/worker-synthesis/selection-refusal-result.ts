import type { SynthesisResult } from '../synthesis/synthesis-result.ts'
import type { SynthesizerIdentity } from '../synthesis/synthesizer-identity.ts'
import type { WorkerSelectionRefusal } from './worker-selection-refusal.ts'
import { workerSynthesisEscalation } from './worker-synthesis-escalation.ts'
import { workerSynthesisExhausted } from './worker-synthesis-exhausted.ts'
import { workerSynthesisInterrupted } from './worker-synthesis-interrupted.ts'

/** A selection pass that stopped the clip: an exhausted ladder or a lost
 * executor leaves it pending, a refusal escalates it. */
export const selectionRefusalResult = (
  selection: WorkerSelectionRefusal,
  identity: SynthesizerIdentity,
): SynthesisResult =>
  selection.exhausted === true
    ? workerSynthesisExhausted(selection.refusal, identity)
    : selection.interrupted === true
      ? workerSynthesisInterrupted(selection.refusal, identity)
      : workerSynthesisEscalation(selection.refusal, identity)
