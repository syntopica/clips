import { formatGradedPage } from './format-graded-page.ts'
import type { GradedPage } from './graded-page.ts'

/** The report, one block per page. Formatting for a single page lives in
 * formatGradedPage; this just joins the batch. */
export const formatGradeReport = (pages: readonly GradedPage[]): string =>
  pages.map((graded) => formatGradedPage(graded)).join('\n')
