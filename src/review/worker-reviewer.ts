import { workerAuthorModel } from '../worker-synthesis/worker-author-model.ts'
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
 * is compared with the diff's author after the fact, and a verdict from the
 * model that wrote the diff - or from an executor that did not report itself -
 * escalates instead of applying. The same fail-closed bounds as the agy gate
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
    if (answer.executor === null)
      return {
        verdict: 'claude',
        reason: 'the worker did not report which executor reviewed the diff',
      }
    const reviewer = workerAuthorModel(answer.executor)
    if (reviewer === input.authorModel)
      return {
        verdict: 'claude',
        reason: `${reviewer} wrote the diff and was handed its review - no independent review`,
      }
    return readAgyVerdict(answer.text)
  },
})
