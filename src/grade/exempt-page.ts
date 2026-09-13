import type { GradedPage } from './graded-page.ts'

/** A page that declared `verification: exempt`. Neither a verdict nor a
 * failure: it was never a candidate, so counting it as ungraded would make the
 * pass fire on every future batch for the pages that maintain themselves
 * somewhere else. */
export const exemptPage = (page: string): GradedPage => ({
  page,
  citedUrls: 0,
  evidenceClips: 0,
  result: null,
  failure: null,
  exempt: true,
})
