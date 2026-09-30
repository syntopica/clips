import { setTimeout as sleep } from 'node:timers/promises'
import type { WorkerJobState } from './worker-job-state.ts'
import { workerRequest } from './worker-request.ts'

/** Wait for a job's output, acknowledge it, and return its text.
 *
 * Returns null when the job ends without output (failed, expired) or is still
 * pending at `waitMs`. Null is what every triage transport returns for a batch
 * it could not read, and it degrades that batch to `review`; a job still
 * pending is not lost, because the next run submits the same content under the
 * same key and collects it.
 *
 * `split_requested` is declined: a triage batch is a single prompt, and the
 * coordinator parks a declined job until an idle period long enough for it.
 * Every result is acknowledged once read, so the coordinator can drop the
 * payload rather than hold it to the unacked deadline.
 *
 * A task parked behind its runner's quota wall returns null at once: waiting
 * out a cooldown per job would stall a run for hours, and the job stays queued
 * for a later run to collect by its key. */
export const awaitWorkerOutput = async (
  jobId: string,
  { pollMs, waitMs }: { pollMs: number; waitMs: number },
): Promise<string | null> => {
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
      if (result.control === null) {
        const output = result.output
        if (output?.json !== undefined) return JSON.stringify(output.json)
        return output?.text ?? null
      }
      if (!decline) return null
    }
    if (Date.now() >= deadline || (job.cooling_until ?? null) !== null)
      return null
    await sleep(pollMs)
  }
}
