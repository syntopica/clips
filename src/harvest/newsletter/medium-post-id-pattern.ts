/** A Medium article URL ends with a 12-character lowercase hex id preceded by a
 * hyphen. Anchored at the end so a longer hex run does not pass by matching its
 * last 12 characters. */
export const MEDIUM_POST_ID_PATTERN = /-[\da-f]{12}$/
