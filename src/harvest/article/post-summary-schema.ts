import { z } from 'zod'

/** The header fields of a Medium post, read loosely because the entry also
 * carries the parameterised `content(...)` key that a strict object would
 * reject. */
export const POST_SUMMARY_SCHEMA = z.looseObject({
  title: z.string(),
  mediumUrl: z.string(),
  isLocked: z.boolean().nullish(),
  creator: z.object({ __ref: z.string() }).nullish(),
})
