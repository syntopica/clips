/** Whether a proposed `sources:` list only appended to the committed one.
 *
 * The hazard positional refs carry, named in the design rather than discovered:
 * reordering `sources:` silently changes what every marker on the page means, so
 * a run that swaps two entries reattributes every claim between them without
 * touching a word of prose.
 *
 * Append-only is the cheap defence. The committed entries must still be there,
 * in the same order, at the same positions; anything new goes after them. A
 * deletion, a reorder and a substitution all fail the same test, which is why
 * this is one comparison rather than three checks.
 *
 * It says nothing about whether the page carries markers. That is the caller's
 * question: a page with no markers has no positions to protect, and every page
 * that exists today is one. */
export const appendOnlySources = (
  committed: readonly string[],
  proposed: readonly string[],
): boolean =>
  proposed.length >= committed.length &&
  committed.every((source, index) => proposed[index] === source)
