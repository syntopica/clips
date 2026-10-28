import type { SynthesisResult } from '../synthesis/synthesis-result.ts'
import type { SynthesizerIdentity } from '../synthesis/synthesizer-identity.ts'
import type { WorkerInferenceFailure } from './worker-inference-failure.ts'
import { workerSynthesisEscalation } from './worker-synthesis-escalation.ts'
import { workerSynthesisExhausted } from './worker-synthesis-exhausted.ts'
import { workerSynthesisInterrupted } from './worker-synthesis-interrupted.ts'

/** A writing job that came back without an answer: an exhausted ladder or a
 * lost executor leaves the clip pending, anything else escalates it. */
export const writingFailureResult = (
  written: WorkerInferenceFailure,
  identity: SynthesizerIdentity,
): SynthesisResult =>
  written.exhausted === true
    ? workerSynthesisExhausted(`writing: ${written.failure}`, identity)
    : written.interrupted === true
      ? workerSynthesisInterrupted(`writing: ${written.failure}`, identity)
      : workerSynthesisEscalation(`writing: ${written.failure}`, identity)
