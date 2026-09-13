/** SPEC:528-543. Closed defaults; raising any of these is a reviewed code
 * change, not configuration. */
export const SYNTHESIS_LIMITS = {
  pagesTouched: 10,
  totalChangedLines: 500,
  changedLinesPerPage: 250,
  diffBytes: 256 * 1024,
  pageBytes: 512 * 1024,
} as const
