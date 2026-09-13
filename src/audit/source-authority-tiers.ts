import type { SourceAuthorityTier } from './source-authority-tier.ts'

/** The authority order, strongest first. Array order **is** the ranking, so
 * this constant is the whole rule and there is no comparator to keep in step
 * with it.
 *
 * Adopted from `gbrain` on 2026-08-03. The half this repository already had is
 * the one that matters most and is unchanged by it: a disagreement is recorded
 * with both citations and never silently resolved. What the order adds is which
 * side to state as current when a page has to state one - without it the answer
 * was recency, which is how a human's tick lost to a later classifier verdict
 * in the newsletter triage lane. */
export const SOURCE_AUTHORITY_TIERS: readonly SourceAuthorityTier[] = [
  'owner',
  'primary',
  'web',
  'social',
]
