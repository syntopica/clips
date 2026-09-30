import type { WorkerInferenceAnswer } from '../worker-synthesis/worker-inference-answer.ts'
import type { WorkerSynthesisPort } from '../worker-synthesis/worker-synthesis-port.ts'
import type { WorkerPortCall } from './worker-port-call.ts'

/** A worker synthesis port answering each pass with a fixed answer and
 * recording what it was sent. */
export const fakeWorkerSynthesisPort = (
  select: WorkerInferenceAnswer,
  write: WorkerInferenceAnswer,
): { port: WorkerSynthesisPort; calls: WorkerPortCall[] } => {
  const calls: WorkerPortCall[] = []
  return {
    calls,
    port: {
      infer: async (step, prompt, _schema, reserveBytes) => {
        calls.push({ step, prompt, reserveBytes })
        return Promise.resolve(step === 'select' ? select : write)
      },
    },
  }
}
