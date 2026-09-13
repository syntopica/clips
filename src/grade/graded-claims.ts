import type { MisattributedClaim } from './misattributed-claim.ts'
import type { UnsupportedClaim } from './unsupported-claim.ts'

/** The two claim lists a graded page's report is built from, defaulted to
 * empty when the page carries no result at all. */
export type GradedClaims = {
  claims: UnsupportedClaim[]
  misattributed: MisattributedClaim[]
}
