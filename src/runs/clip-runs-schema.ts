import { z } from 'zod'
import { RunUsageSchema } from './run-usage-schema.ts'

/** The run history of one clip, oldest first. */
export const ClipRunsSchema = z.array(
  z.object({
    startedAt: z.string(),
    durationMs: z.number(),
    outcome: z.enum(['synthesized', 'escalated', 'skipped']),
    model: z.string(),
    boundary: z.string(),
    workerJobIds: z.array(z.string()),
    usage: RunUsageSchema.nullable(),
  }),
)
