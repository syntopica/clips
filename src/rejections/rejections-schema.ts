import { z } from 'zod'

/** `rejections.json` is a list, oldest first. Defensive like every other reader
 * of a file on disk: a shape this does not recognise is treated as no history
 * rather than as a parse failure, because a clip whose rejection log went bad
 * must still be ingestable. */
export const RejectionsSchema = z.array(
  z.object({ at: z.string(), reason: z.string() }),
)
