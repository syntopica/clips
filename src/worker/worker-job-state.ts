import type { WorkerResult } from './worker-result.ts'

/** `GET /v1/jobs/{id}`: the job's state, its latest unacknowledged result, and
 * when a quota wall stops holding a queued task back. `cooling_until` is
 * absent from coordinators that predate it. */
export type WorkerJobState = {
  state: string
  result: WorkerResult | null
  cooling_until?: number | null
}
