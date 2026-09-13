import type { GradeVerdict } from './grade-verdict.ts'
import type { MisattributedClaim } from './misattributed-claim.ts'
import type { UnsupportedClaim } from './unsupported-claim.ts'

/** One graded page: what the grader could not find support for, what it was
 * never in a position to check, its own one-sentence summary, and the label it
 * gave itself. The label is redundant with the unsupported list when the grader
 * is consistent, which is exactly why it is asked for - see
 * `graderContradiction`.
 *
 * `uncheckable` is the page's own words for a claim marked `[OWN]`: the owner's
 * first-hand knowledge, which no cited source could ever support and which
 * grading against those sources therefore says nothing about. It carries no
 * `why`, because the reason is the same on every entry and a field whose value
 * never varies is decoration.
 *
 * `misattributed` is the third kind and feeds the verdict the way `unsupported`
 * does: a marker pointing at the wrong source is an error on the page, not a
 * limit of what can be checked here. See `misattributed-claim.ts` for why no
 * offline check can find it.
 *
 * `uncheckable` does **not** feed the verdict. A page whose only findings are uncheckable
 * grades `clean` - the shape `verification: exempt` already uses, a state that
 * reads differently without firing. Passing such a claim in silence was the
 * alternative and is worse: silence is how an unverified page came to look
 * clean in the first place. */
export type GradeResult = {
  unsupported: UnsupportedClaim[]
  uncheckable: string[]
  misattributed: MisattributedClaim[]
  summary: string
  verdict: GradeVerdict
}
