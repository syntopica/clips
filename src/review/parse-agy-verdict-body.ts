import type { AgyVerdictParseResult } from './agy-verdict-parse-result.ts'

/** Turn agy's raw stdout into a loosely-typed verdict object, or the reason
 * it could not be read as one: empty (spent quota, or a previous instance
 * still shutting down), not JSON, or JSON that is not an object. */
export const parseAgyVerdictBody = (
  body: string | null,
): AgyVerdictParseResult => {
  if (body === null || body.trim() === '')
    return { parseFailureReason: 'agy returned no verdict' }
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return { parseFailureReason: 'agy returned an unparseable verdict' }
  }
  if (typeof parsed !== 'object' || parsed === null)
    return { parseFailureReason: 'agy returned an unparseable verdict' }
  return parsed
}
