import { z } from 'zod'

/** A GraphQL error payload. Matched before anything else, because an error is
 * schema drift rather than an empty reading list and must never be parsed
 * past. */
export const GRAPHQL_ERRORS_SCHEMA = z.object({
  errors: z.array(z.object({ message: z.string() })).min(1),
})
