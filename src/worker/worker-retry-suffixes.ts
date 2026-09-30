/** Suffixes tried in order when a content key's job is already consumed.
 * Four keys bound how often one batch can be re-run through the queue before
 * the run stops and says so. */
export const WORKER_RETRY_SUFFIXES = ['', ':r1', ':r2', ':r3'] as const
