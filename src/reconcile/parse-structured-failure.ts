import { STRUCTURED_FAILURE_PREFIX } from './structured-failure-prefix.ts'
import type { StructuredFailureRecord } from './structured-failure-record.ts'
import { StructuredFailureSchema } from './structured-failure-schema.ts'

/** Read back what `structuredFailure` wrote. Null for anything else, which is
 * a real case rather than corruption: the prefix exists precisely because the
 * field held free text before it, and a clip parked by hand has whatever the
 * hand wrote. A caller that cannot identify the failure must not act on it. */
export const parseStructuredFailure = (
  failure: string | null,
): StructuredFailureRecord | null => {
  if (failure === null || !failure.startsWith(STRUCTURED_FAILURE_PREFIX))
    return null
  try {
    const parsed = StructuredFailureSchema.safeParse(
      JSON.parse(failure.slice(STRUCTURED_FAILURE_PREFIX.length)),
    )
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
