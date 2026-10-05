/** The worker queue the automatic review gate submits to. Its own queue rather
 * than `clips.synthesis` so the instance can order the review ladder apart from
 * the writing one, starting on a different model than the one most likely to
 * have written the diff. */
export const WORKER_REVIEW_QUEUE = 'clips.review'
