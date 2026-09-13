import { z } from 'zod'

/** The paragraph order comes from `content(...).bodyModel.paragraphs`, a list of
 * `__ref` strings, rather than from iterating the `"Paragraph:*"` keys: a page
 * can cache paragraphs belonging to other posts, and key insertion order is not
 * a documented guarantee of document order. */
export const POST_BODY_SCHEMA = z.object({
  bodyModel: z.object({
    paragraphs: z.array(z.object({ __ref: z.string() })),
  }),
})
