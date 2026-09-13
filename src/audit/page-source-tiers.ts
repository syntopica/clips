import { pageSources } from './page-sources.ts'
import type { SourceAuthorityTier } from './source-authority-tier.ts'
import { SOURCE_AUTHORITY_TIERS } from './source-authority-tiers.ts'
import { tierOfSource } from './tier-of-source.ts'

/** The distinct authority tiers a page's sources fall into, strongest first.
 *
 * Ordered by filtering the ranking rather than by sorting the page's own
 * entries, so the ranking is read from `SOURCE_AUTHORITY_TIERS` in one place
 * and no comparator can disagree with it. */
export const pageSourceTiers = (page: string): SourceAuthorityTier[] => {
  const present = new Set(pageSources(page).map(tierOfSource))
  return SOURCE_AUTHORITY_TIERS.filter((tier) => present.has(tier))
}
