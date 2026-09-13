import type { GradedPage } from './graded-page.ts'

/** A page that never reached the grader, with the reason. The counts are zero
 * because nothing was read: a page that failed before its sources were resolved
 * has no honest number to report, and printing a count of zero cited sources
 * next to "page not found" would invite reading it as a finding. */
export const ungradedPage = (page: string, failure: string): GradedPage => ({
  page,
  citedUrls: 0,
  evidenceClips: 0,
  result: null,
  failure,
  exempt: false,
})
