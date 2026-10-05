import { gradeTiersOfAuthor } from '../grade/grade-tiers-of-author.ts'
import { LOCAL_GRADE_TIER } from '../grade/local-grade-tier.ts'
import type { Reviewer } from './reviewer.ts'

/** The worker gate that routes a diff away from the tier that wrote it.
 *
 * The worker reviewer escalates a verdict from the author's own tier, and a
 * job cannot name its executor - only its queue. On 2026-10-05, once the
 * OpenRouter allowance was spent, every clip was written by the local model
 * and then reviewed by it on the home queue, so every one escalated. So the
 * author picks the queue: a diff the local model wrote goes to `remote`,
 * whose ladder reaches OpenRouter; anything else stays on `home`. Each
 * reviewer keeps its own tier check, so a misrouted job still escalates. */
export const tierAwareReviewer = (
  remote: Reviewer,
  home: Reviewer,
): Reviewer => ({
  automatic: true,
  review: async (input) =>
    (gradeTiersOfAuthor(input.authorModel)?.includes(LOCAL_GRADE_TIER)
      ? remote
      : home
    ).review(input),
})
