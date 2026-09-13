/** What the observer carries across a synthesis run: every page's access time
 * as it stood before the transport started, or the fact that this filesystem
 * does not record reads and nothing can be concluded from comparing them. */
export type ReadObservation =
  { observable: true; baseline: Map<string, number> } | { observable: false }
