import type { GradeTotals } from './grade-totals.ts'
import type { GradedPage } from './graded-page.ts'

/** Sum a batch of graded pages into the counts `grade` prints and checks for
 * exit status. */
export const computeGradeTotals = (
  graded: readonly GradedPage[],
): GradeTotals => ({
  unsupported: graded.reduce(
    (total, page) => total + (page.result?.unsupported.length ?? 0),
    0,
  ),
  uncheckable: graded.reduce(
    (total, page) => total + (page.result?.uncheckable.length ?? 0),
    0,
  ),
  misattributed: graded.reduce(
    (total, page) => total + (page.result?.misattributed.length ?? 0),
    0,
  ),
  ungraded: graded.filter((page) => page.failure !== null).length,
  exempt: graded.filter((page) => page.exempt).length,
})
