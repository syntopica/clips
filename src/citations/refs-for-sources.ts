import type { ClaimRef } from './claim-ref.ts'

/** The refs a page's `sources:` list makes available: `S1` for the first entry,
 * `S2` for the second, and so on.
 *
 * Positional and nothing else, which is what keeps the scheme free: no mapping
 * is stored, so no mapping can disagree with the list. The cost is that
 * reordering `sources:` changes what every marker on the page means, which is
 * why milestone 2 makes the list append-only on a page carrying markers.
 *
 * `OWN` is not here. It belongs to no source and is available on every page,
 * including one with no `sources:` at all. */
export const refsForSources = (
  sources: readonly string[],
): readonly ClaimRef[] =>
  sources.map((_, index) => `S${String(index + 1)}` as ClaimRef)
