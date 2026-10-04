/** Runs kept per clip. A clip that keeps failing is retried by every ingest,
 * and the history exists to show the recent ones, not to grow without end. */
export const MAX_CLIP_RUNS = 20
