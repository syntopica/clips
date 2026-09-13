import { z } from 'zod'

import { BoundaryDecisionRowSchema } from './boundary-decision-row-schema.ts'

export const BoundaryDecisionSchema = z.object({
  schemaVersion: z.literal(1),
  decision: z.enum([
    'CODEX_ENABLED',
    'CODEX_DISABLED',
    'CODEX_OPERATOR_OVERRIDE',
  ]),
  decidedAt: z.string().min(1),
  mechanism: z.string().min(1),
  reproducibleCommand: z.string().min(1),
  mechanismsEvaluated: z.array(z.string().min(1)).min(1),
  rows: z.array(BoundaryDecisionRowSchema),
  justification: z.string().min(1),
})
