import type { z } from 'zod'

import type { BoundaryDecisionSchema } from './boundary-decision-schema.ts'

export type BoundaryDecision = z.infer<typeof BoundaryDecisionSchema>
