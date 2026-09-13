/** What parseAgyVerdictBody returns: either the parsed JSON body (loosely
 * typed, since agy's own shape is unverified) or the reason parsing could not
 * even get that far. */
export type AgyVerdictParseResult =
  { verdict?: unknown; reason?: unknown } | { parseFailureReason: string }
