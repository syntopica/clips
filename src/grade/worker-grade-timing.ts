/** How the grade lane waits on a worker job: every 15 s for up to 90 minutes,
 * room for the forty-minute grading cap plus a node yielding to its user. */
export const WORKER_GRADE_TIMING = { pollMs: 15_000, waitMs: 90 * 60_000 }
