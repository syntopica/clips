import type { SourceAuthorityTier } from '../audit/source-authority-tier.ts'
import { tierOfSource } from '../audit/tier-of-source.ts'
import type { ClaimRef } from './claim-ref.ts'
import { OWN_CLAIM_REF } from './own-claim-ref.ts'
import { refsForSources } from './refs-for-sources.ts'

/** How much weight one claim's ref carries, or null when it names no source.
 *
 * `OWN` is `owner`, and this function is the whole reason that tier stops being
 * decoration: `SOURCE_AUTHORITY_TIERS` has listed it since the authority order
 * shipped with a comment saying nothing returns it, because a `sources:` entry
 * is a path or a url and none of them is the owner. A marker is.
 *
 * Every other ref takes the tier of the entry it points at, through
 * `tierOfSource`, so a claim inherits the rank of its own source rather than
 * the rank of the page. That is what a contradiction between two claims on one
 * page needs in order to have a side that outranks.
 *
 * Null for an unresolved ref rather than a throw or a bottom rank: an
 * unresolved marker is a typo, and inventing a tier for it would rank a claim
 * on a source that does not exist. `unresolvedClaimRefs` is what reports it. */
export const tierOfClaimRef = (
  ref: ClaimRef,
  sources: readonly string[],
): SourceAuthorityTier | null => {
  if (ref === OWN_CLAIM_REF) return 'owner'
  const index = refsForSources(sources).indexOf(ref)
  const source = index === -1 ? undefined : sources[index]
  return source === undefined ? null : tierOfSource(source)
}
