import { setTimeout as sleep } from 'node:timers/promises'
import type { WorkerJobState } from './worker-job-state.ts'
import { workerRequest } from './worker-request.ts'
import type { WorkerResult } from './worker-result.ts'

/** Wait for a job's output row, acknowledge it, and return it whole.
 *
 * Returns null when the job ends without output (failed, expired) or is still
 * pending at `waitMs`. Null is what every transport reports for work it could
 * not collect; a job still pending is not lost, because the next run submits
 * the same content under the same key and collects it.
 *
 * `split_requested` is declined: every job this engine submits is a single
 * prompt, and the coordinator parks a declined job until an idle period long
 * enough for it. Every result is acknowledged once read, so the coordinator
 * can drop the payload rather than hold it to the unacked deadline.
 *
 * A task parked behind its runner's quota wall returns null at once: waiting
 * out a cooldown per job would stall a run for hours, and the job stays queued
 * for a later run to collect by its key.
 *
 * The row rather than its text, because synthesis has to know which model
 * answered - `executor` - to record the page's author. */
export const awaitWorkerResult = async (
  jobId: string,
  { pollMs, waitMs }: { pollMs: number; waitMs: number },
): Promise<WorkerResult | null> => {
  const path = `/v1/jobs/${encodeURIComponent(jobId)}`
  const deadline = Date.now() + waitMs
  for (;;) {
    const job = (await workerRequest('GET', path)) as WorkerJobState
    const result = job.result
    if (result !== null) {
      const decline = result.control === 'split_requested'
      await workerRequest('POST', `${path}/ack`, {
        result_id: result.result_id,
        decline,
      })
      if (result.control === null) return result
      if (!decline) return null
    }
    if (Date.now() >= deadline || (job.cooling_until ?? null) !== null)
      return null
    await sleep(pollMs)
  }
}
