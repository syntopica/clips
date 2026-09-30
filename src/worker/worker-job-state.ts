import type { WorkerResult } from './worker-result.ts'

/** `GET /v1/jobs/{id}`: the job's state and its latest unacknowledged result. */
export type WorkerJobState = {
  state: string
  result: WorkerResult | null
}
