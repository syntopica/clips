import { z } from 'zod'

/** The shape `structuredFailure` serializes, parsed back strictly: a caller
 * deciding whether to requeue a clip must not read a hole as a value. */
export const StructuredFailureSchema = z.object({
  version: z.number(),
  stage: z.string(),
  code: z.string(),
  message: z.string(),
  retryable: z.boolean(),
  occurredAt: z.string(),
})
