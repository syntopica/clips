/** How synthesis waits on a worker job: every 10 s for up to 45 minutes. A
 * local 35B model writes a page in a few minutes; the rest is a node yielding
 * to its user or to memory pressure before it takes the job. */
export const WORKER_SYNTHESIS_TIMING = { pollMs: 10_000, waitMs: 45 * 60_000 }
