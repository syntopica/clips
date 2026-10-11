import type { WorkerInferenceAnswer } from '../worker-synthesis/worker-inference-answer.ts'
import type { FakeWorkerSynthesisPortResult } from './fake-worker-synthesis-port-result.ts'
import type { WorkerPortCall } from './worker-port-call.ts'

/** A worker synthesis port answering each pass with a fixed answer and
 * recording what it was sent. */
export const fakeWorkerSynthesisPort = (
  select: WorkerInferenceAnswer,
  write: WorkerInferenceAnswer,
): FakeWorkerSynthesisPortResult => {
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
