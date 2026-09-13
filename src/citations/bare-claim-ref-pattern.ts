/** A claim marker that has not been rewritten yet: `[S1]`, `[OWN]`.
 *
 * Narrower than `CLAIM_REF_PATTERN` on purpose, and the difference is what
 * makes the rewrite idempotent. The rewritten form `[[S1]](#sources)` contains
 * `[S1]`, so a naive replace run twice produces
 * `[[[S1]](#sources)](#sources)`. The lookbehind rules out a marker already
 * wrapped in an outer bracket, and the lookahead rules out one that is already
 * the text of a markdown link.
 *
 * The rewrite pass runs on every ingest and a page can be edited by several,
 * so running it twice has to be the same as running it once. */
export const BARE_CLAIM_REF_PATTERN = /(?<!\[)\[(S\d+|OWN)\](?!\()/gu
