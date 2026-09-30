import type { WorkerJobState } from './worker-job-state.ts'
import { workerRequest } from './worker-request.ts'
import { WORKER_TERMINAL_STATES } from './worker-terminal-states.ts'

const RETRY_SUFFIXES = ['', ':r1', ':r2', ':r3'] as const

/** Submit a job and return the id of a live one for this content.
 *
 * The idempotency key is derived from the content, so a rerun re-finds a job a
 * previous run left queued or finished instead of paying for it twice. A key
 * whose job already ended with nothing to collect - acknowledged, failed or
 * expired - is walked past with a retry suffix, the same walk atrium's worker
 * lane settled on after a consumed key blocked it on 2026-09-29. */
export const submitWorkerJob = async (
  job: Record<string, unknown> & { idempotency_key: string },
): Promise<string> => {
  for (const suffix of RETRY_SUFFIXES) {
    const posted = (await workerRequest('POST', '/v1/jobs', {
      ...job,
      idempotency_key: job.idempotency_key + suffix,
    })) as { id: string }
    const state = (await workerRequest(
      'GET',
      `/v1/jobs/${encodeURIComponent(posted.id)}`,
    )) as WorkerJobState
    if (state.result === null && WORKER_TERMINAL_STATES.has(state.state))
      continue
    return posted.id
  }
  throw new Error('worker job retries exhausted for this content')
}
