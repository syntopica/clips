import type { SourceAuthorityTier } from './source-authority-tier.ts'

/** One contradiction line, with the authority spread of the page's sources
 * appended when there is a spread to report.
 *
 * A page whose sources all sit in one tier gets the bare line. The ranking has
 * nothing to say there - both sides of the disagreement carry the same weight,
 * and printing `[sources: web]` on every finding would be the decoration that
 * teaches the reader to skip the suffix on the findings where it matters. */
export const contradictionDetail = (
  contradiction: string,
  tiers: readonly SourceAuthorityTier[],
): string =>
  tiers.length > 1
    ? `${contradiction} [sources: ${tiers.join(' > ')}]`
    : contradiction
