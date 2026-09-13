import type { GradedPage } from './graded-page.ts'

/** The report line for a page with no unsupported or misattributed claims:
 * its evidence count and the grader's own one-sentence summary. */
export const formatCleanGradeLine = (
  graded: GradedPage,
  evidence: string,
): string =>
  `${graded.page}: clean (${evidence})\n  ${graded.result?.summary ?? ''}\n`
