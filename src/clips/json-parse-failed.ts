/** Sentinel returned by `parseJson` on failure. A Symbol, not `null`, because
 * a legitimately parsed `null` is valid JSON and must not be mistaken for a
 * parse failure. */
export const JSON_PARSE_FAILED = Symbol('json parse failed')
