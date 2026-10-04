import type { Reviewer } from './reviewer.ts'

/** The gate that stays independent when synthesis lands on the gate's model.
 *
 * Synthesis falls back to `primaryModel` whenever the Claude pool is spent,
 * and on 2026-10-04 it was spent for 133 hours: every clip of an unattended
 * batch was then written by the primary reviewer's own model, and
 * `agyReviewer` escalated each one rather than mark its own work. So the
 * author decides the gate, at review time and from the run's identity: a diff
 * the primary model wrote goes to `second`, which must be built on a different
 * model; anything else goes to `primary`. Each reviewer keeps its own
 * same-model guard, so a misconfigured pair still escalates instead of
 * approving. */
export const authorAwareReviewer = (
  primaryModel: string,
  primary: Reviewer,
  second: Reviewer,
): Reviewer => ({
  automatic: true,
  review: async (input) =>
    (input.authorModel === primaryModel ? second : primary).review(input),
})
