import { EVERY_GRADE_TIER } from '../grade/every-grade-tier.ts'
import { gradeTiersOfAuthor } from '../grade/grade-tiers-of-author.ts'
import { graderAuthorRefusal } from '../grade/grader-author-refusal.ts'
import type { WorkerSynthesisPort } from '../worker-synthesis/worker-synthesis-port.ts'
import { agyReviewPrompt } from './agy-review-prompt.ts'
import { AGY_REVIEW_SCHEMA } from './agy-review-schema.ts'
import { diffNeedsHuman } from './diff-needs-human.ts'
import { readAgyVerdict } from './read-agy-verdict.ts'
import type { Reviewer } from './reviewer.ts'
import { sensitiveDiffRefusal } from './sensitive-diff-refusal.ts'

/** The automatic review gate as a tool-less inference job on the worker.
 *
 * The agy gate needs Gemini's quota, and on 2026-10-05 both of agy's model
 * families were spent for days; the worker's ladder picks whichever executor
 * is free. That freedom is what makes independence a check rather than a
 * setting: the job cannot name an executor, so the answer's reported executor
 * is placed on a tier after the fact, and a verdict from the tier that wrote
 * the diff - or from an executor no tier holds - escalates instead of
 * applying. The same fail-closed bounds as the agy gate
 * run first: `diffNeedsHuman` and the sensitive-path refusal are checked on the
 * diff text before any model sees it. */
export const workerReviewer = (port: WorkerSynthesisPort): Reviewer => ({
  automatic: true,
  review: async (input) => {
    const diff = await input.fullDiff()
    const sensitive = sensitiveDiffRefusal(diff)
    if (sensitive !== null) return { verdict: 'claude', reason: sensitive }
    const blocked = diffNeedsHuman(diff)
    if (blocked !== null) return { verdict: 'claude', reason: blocked }
    const answer = await port.infer(
      'review',
      agyReviewPrompt(diff),
      AGY_REVIEW_SCHEMA,
      4096,
    )
    if ('failure' in answer)
      return { verdict: 'claude', reason: `review: ${answer.failure}` }
    // The grade lane's tier policy, not a model-name match: OpenRouter
    // reports whichever fallback answered, so two names on one tier prove
    // nothing, and an author the lane cannot place refuses every tier.
    const refusal = graderAuthorRefusal(
      answer.executor,
      gradeTiersOfAuthor(input.authorModel) ?? EVERY_GRADE_TIER,
    )
    if (refusal !== null) return { verdict: 'claude', reason: refusal }
    return readAgyVerdict(answer.text)
  },
})
