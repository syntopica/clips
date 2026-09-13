import { z } from 'zod'

/** `promote-failures.json` is a list, first-failed first. Defensive like every
 * other reader of a file on disk: a shape this does not recognise reads as no
 * history rather than as a parse failure, because a run whose failure log went
 * bad must still be promotable. */
export const PromoteFailuresSchema = z.array(
  z.object({
    url: z.string(),
    title: z.string(),
    topic: z.string(),
    attempts: z.number().int().positive(),
    lastError: z.string(),
    lastAttemptAt: z.string(),
  }),
)
