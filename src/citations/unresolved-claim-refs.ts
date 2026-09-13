import type { ClaimRef } from './claim-ref.ts'
import { OWN_CLAIM_REF } from './own-claim-ref.ts'
import { refsForSources } from './refs-for-sources.ts'

/** The refs on a page that name a source the page does not have.
 *
 * `OWN` is always resolved and never counted against the source list: it is the
 * owner's own knowledge, available on a page with no `sources:` at all. Every
 * other ref has to land inside `refsForSources`, so `S3` on a two-source page
 * is unresolved and so is `S0`.
 *
 * This is the check the design calls free: it needs no model, no network and no
 * clip, and it reports nothing on the 110 pages that exist today because none
 * of them carries a marker. That is the correct reading of a wiki written
 * before the scheme, not a check that fails to fire. */
export const unresolvedClaimRefs = (
  refs: readonly ClaimRef[],
  sources: readonly string[],
): readonly ClaimRef[] => {
  const available = refsForSources(sources)
  return refs.filter((ref) => ref !== OWN_CLAIM_REF && !available.includes(ref))
}
