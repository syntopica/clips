import type { WorkerExecutor } from '../worker/worker-executor.ts'

/** What one synthesis inference job came back with: the model's answer and
 * who produced it, or the reason there is no answer. */
export type WorkerInferenceAnswer =
  { text: string; executor: WorkerExecutor | null } | { failure: string }
