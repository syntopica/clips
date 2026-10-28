import type { WorkerJobState } from './worker-job-state.ts'
import { workerRequest } from './worker-request.ts'

/** Whether a job failed because its executor vanished mid-run rather than
 * because of anything it was asked.
 *
 * The coordinator fails a job `lease_lost` when the node holding it stops
 * renewing the lease: on 2026-10-28 a session booted out the MacBook's worker
 * node for memory, and the writing job of clip 01M097NSDE2ESB5KMBGRDEPPJY ended
 * that way after its selection job had succeeded. */
export const workerJobLeaseLost = async (jobId: string): Promise<boolean> => {
  const job = (await workerRequest(
    'GET',
    `/v1/jobs/${encodeURIComponent(jobId)}`,
  )) as WorkerJobState
  return job.state === 'failed' && job.error === 'lease_lost'
}
