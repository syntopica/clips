/** The already-clipped line of a promote summary, silent when nothing was
 * skipped. Printing `0 (skipped)` on a first run reads as a fault where there
 * is none. */
export const formatSkippedArticles = (skipped: number): string =>
  skipped > 0 ? `  already clipped  ${String(skipped)} (skipped)\n` : ''
