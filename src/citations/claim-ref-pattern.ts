/** A claim marker in prose: `[S1]`, `[S12]`, `[OWN]`.
 *
 * It matches the rewritten form too, and deliberately. The rewrite that lands
 * with milestone 3 turns a bare marker into `[[S1]](#sources)`, whose inner
 * `[S1]` is this same span - so one pattern reads a page whichever pass last
 * touched it, and the lint does not go blind the day the rewrite ships.
 *
 * `S0` and `S99` match. Neither resolves on any real page, and reporting them
 * as unresolved refs is the honest reading: a marker whose number is out of
 * range is a typo the author meant as a citation, not prose that happens to
 * look like one.
 *
 * Global because `matchAll` requires it. Never call `test` on it - a global
 * pattern carries `lastIndex` between calls, and this one is shared. */
export const CLAIM_REF_PATTERN = /\[(S\d+|OWN)\]/g
