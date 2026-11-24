import { GRADE_TIER_PROVIDERS } from './grade-tier-providers.ts'

/** The worker executor providers that occupy any of these grade tiers, each
 * once. A tier no provider is known for contributes none: the worker cannot be
 * asked to exclude what this lane cannot name, and `graderAuthorRefusal` still
 * checks the answer. */
export const providersOfGradeTiers = (tiers: readonly string[]): string[] => [
  ...new Set(tiers.flatMap((tier) => GRADE_TIER_PROVIDERS[tier] ?? [])),
]
