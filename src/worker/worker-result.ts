import type { WorkerExecutor } from './worker-executor.ts'

/** One row of a worker job's latest unacknowledged result, contract v1.
 *
 * `control` is null for an output and names the state otherwise
 * (`split_requested`, `failed`, `expired`, `unacked_expired`). `executor` is
 * what actually ran the job, and is absent on a control row. */
export type WorkerResult = {
  result_id: string
  control: string | null
  output: { text?: string; json?: unknown } | null
  executor?: WorkerExecutor | null
}
