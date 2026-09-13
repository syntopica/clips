import { z } from 'zod'

/**
 * One recorded probe row.
 *
 * exitCode, signal, and stderrExcerpt are validated for shape but not read by
 * any consumer of BoundaryDecision: they exist for human audit of a recorded
 * row, and the gate in read-boundary-decision.ts deliberately does not rely
 * on them - only `expected` and `actual` drive the decision.
 */
export const BoundaryDecisionRowSchema = z.object({
  id: z.string().min(1),
  expected: z.enum(['succeeded', 'denied']),
  actual: z.enum(['succeeded', 'denied', 'inconclusive']),
  exitCode: z.number().nullable(),
  signal: z.string().nullable(),
  stderrExcerpt: z.string(),
})
