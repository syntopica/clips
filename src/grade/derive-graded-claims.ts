import type { GradedClaims } from './graded-claims.ts'
import type { GradedPage } from './graded-page.ts'

/** Read the unsupported and misattributed claim lists off a graded page,
 * defaulting each to empty when the page carries no result. */
export const deriveGradedClaims = (graded: GradedPage): GradedClaims => ({
  claims: graded.result?.unsupported ?? [],
  misattributed: graded.result?.misattributed ?? [],
})
