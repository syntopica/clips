import type { WorkerJobState } from './worker-job-state.ts'
import { workerRequest } from './worker-request.ts'

/** Whether the worker failed a job because the providers it excluded left no
 * executor its queue could have used, rather than because of anything it was
 * asked. The coordinator fails such a job at submission, so no executor was
 * tried and nothing was spent. */
export const workerJobNoEligibleExecutor = async (
  jobId: string,
): Promise<boolean> => {
  const job = (await workerRequest(
    'GET',
    `/v1/jobs/${encodeURIComponent(jobId)}`,
  )) as WorkerJobState
  return job.state === 'failed' && job.error === 'no_eligible_executor'
}
