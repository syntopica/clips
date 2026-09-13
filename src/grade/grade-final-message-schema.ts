import { z } from 'zod'

/** The runtime validator for the grader's schema-constrained final message. The
 * JSON Schema handed to --output-schema lives in grade-output-schema.ts and the
 * two describe the same shape. */
export const GradeFinalMessageSchema = z.object({
  unsupported: z.array(
    z.object({ claim: z.string().max(2000), why: z.string().max(2000) }),
  ),
  uncheckable: z.array(z.string().max(2000)),
  /** Defaulted rather than required, so a log written before this class existed
   * still parses. A grader that omits it found none; a grader that cannot emit
   * it at all is a transport problem the runner already reports. */
  misattributed: z
    .array(
      z.object({
        claim: z.string().max(2000),
        marker: z.string().max(100),
        shouldBe: z.string().max(100).nullable(),
        why: z.string().max(2000),
      }),
    )
    .default([]),
  summary: z.string().max(2000),
  verdict: z.enum(['clean', 'unsupported']),
})
