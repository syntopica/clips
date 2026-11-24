import { workerJobNoEligibleExecutor } from '../worker/worker-job-no-eligible-executor.ts'
import type { WorkerInferenceFailure } from './worker-inference-failure.ts'

/** The failure for a job the worker refused because its exclusion left no
 * executor, or null when the job ended any other way or excluded nothing.
 *
 * Nothing ran and nothing was spent, so it carries no `exhausted` or
 * `interrupted` flag: the caller treats it as any other job without an
 * answer. */
export const workerNoEligibleExecutorFailure = async (
  jobId: string,
  queue: string,
  excluded: readonly string[],
): Promise<WorkerInferenceFailure | null> =>
  excluded.length > 0 && (await workerJobNoEligibleExecutor(jobId))
    ? {
        failure: `worker job ${jobId} on ${queue} had no eligible executor once ${excluded.join(', ')} excluded (no_eligible_executor)`,
        jobId,
      }
    : null
