/** How many words a quoted span must carry before anything treats it as a
 * quotation from a source.
 *
 * Measured on the live wiki rather than guessed: 521 quoted spans across the
 * five page directories, of which 243 are a single word and 467 are five words
 * or fewer. Those short ones are what quotes are mostly used for here - a UI
 * string, a flag, a field name, a term held at arm's length - and none of them
 * is a span any source could be expected to contain verbatim. Grounding them
 * would report the wiki's own vocabulary as missing evidence, which is the
 * always-fires shape this repository has switched off once.
 *
 * Six is where the corpus stops looking like vocabulary and starts looking like
 * copied prose: an article title, a sentence lifted from a clip, a line of
 * captured output. A quotation shorter than that is not exempt from being
 * accurate - it is simply not something a mechanical check can distinguish from
 * emphasis. */
export const QUOTATION_WORD_FLOOR = 6
