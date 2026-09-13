import { z } from 'zod'

/** A `Post` entity inside a reading-list page. */
export const SAVED_POST_ENTITY_SCHEMA = z.object({
  id: z.string(),
  title: z.string(),
  mediumUrl: z.string(),
  readingTime: z.number().nullish(),
  // Medium types this as a Long, so it arrives as epoch milliseconds; a string
  // is accepted too because the reconstructed query cannot pin the scalar, and
  // `SavedPost` declares the field as a string.
  firstPublishedAt: z.union([z.number(), z.string()]).nullish(),
  creator: z.object({ name: z.string().nullish() }).nullish(),
})
