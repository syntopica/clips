import type { ZodError } from 'zod'

/** The field path from the first zod validation issue, or a fallback when the
 * error somehow carries no issues. Keeps the reason to one line for
 * `clips status`. */
export const firstIssuePath = (error: ZodError): string =>
  error.issues[0]?.path.join('.') ?? 'unknown field'
