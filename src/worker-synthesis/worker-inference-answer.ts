import type { WorkerExecutor } from '../worker/worker-executor.ts'
import type { WorkerInferenceFailure } from './worker-inference-failure.ts'

/** What one synthesis inference job came back with: the model's answer and
 * who produced it, or the reason there is no answer. `jobId` is the worker job
 * that was asked, absent when the prompt was refused before submission. */
export type WorkerInferenceAnswer =
  | { text: string; executor: WorkerExecutor | null; jobId?: string }
  | WorkerInferenceFailure
