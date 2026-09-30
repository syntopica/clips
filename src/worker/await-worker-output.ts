import { awaitWorkerResult } from './await-worker-result.ts'
import { workerOutputText } from './worker-output-text.ts'

/** Wait for a job's output, acknowledge it, and return its text.
 *
 * The waiting, acknowledging and giving up are `awaitWorkerResult`'s; this is
 * the view the triage, refine and grade lanes want, where only the answer
 * matters. Null degrades a triage batch to `review` and reports a page as
 * ungraded. */
export const awaitWorkerOutput = async (
  jobId: string,
  timing: { pollMs: number; waitMs: number },
): Promise<string | null> => {
  const result = await awaitWorkerResult(jobId, timing)
  return result === null ? null : workerOutputText(result.output)
}
