import { z } from 'zod'
import { TRIAGE_TOPICS } from './triage-topic.ts'

/** The same contract as `TRIAGE_OUTPUT_SCHEMA`, enforced on the way back in.
 * codex constrains its own output, but this pass is what makes an unexpected
 * payload a loud parse failure instead of silently classified articles. */
export const TriageVerdictSchema = z.object({
  verdicts: z.array(
    z.object({
      id: z.number().int(),
      bucket: z.enum(['ingest', 'review', 'rejected']),
      topic: z.enum(TRIAGE_TOPICS),
      reason: z.string(),
    }),
  ),
})
