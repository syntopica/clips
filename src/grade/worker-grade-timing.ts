/** How the grade lane waits on a worker job: every 15 s for up to 90 minutes,
 * room for the ladder's agy rung, the escalation behind it and a node
 * yielding to its user before the local model takes the job. */
export const WORKER_GRADE_TIMING = { pollMs: 15_000, waitMs: 90 * 60_000 }
