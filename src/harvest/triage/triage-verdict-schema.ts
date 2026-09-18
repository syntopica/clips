import { z } from 'zod'
import { TRIAGE_TOPIC_PATTERN } from './triage-topic-pattern.ts'

/** The same contract as `triageOutputSchema`, enforced on the way back in.
 * codex constrains its own output, but this pass is what makes an unexpected
 * payload a loud parse failure instead of silently classified articles.
 *
 * The topic is checked for shape, not membership: the configured list is
 * enforced where the model is constrained, by the output schema each transport
 * is handed, so this pass stays free of the instance's configuration. */
export const TriageVerdictSchema = z.object({
  verdicts: z.array(
    z.object({
      id: z.number().int(),
      bucket: z.enum(['ingest', 'review', 'rejected']),
      topic: z.string().regex(TRIAGE_TOPIC_PATTERN),
      reason: z.string(),
    }),
  ),
})
