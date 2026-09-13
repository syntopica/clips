/** The shortest extraction taken as real.
 *
 * Defuddle returns an object even for a near-empty shell page, wrapping whatever
 * text it found, so a minimum rejects those trivial wrappers and lets the chain
 * fall through to the DOM-shape steps, which are more honest about an extractor
 * that found nothing. Copied from brain-clipper, which uses the same number for
 * the same reason.
 *
 * It gates the chain, never a headless retry. `news.ycombinator.com/item?id=1`
 * is 57 words and complete, so a length threshold deciding "this page needs a
 * browser" would fire on short-but-whole pages - the always-fires shape in a
 * different hat. */
export const MIN_EXTRACTED_LENGTH = 100
