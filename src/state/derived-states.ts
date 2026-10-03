import type { DerivedState } from './derived-state.ts'

/** Every value of DerivedState, in pipeline order. `clips status --json`
 * reports each one, zero included, so a consumer never has to tell an absent
 * key from a state nothing is in. */
export const DERIVED_STATES: readonly DerivedState[] = [
  'pending',
  'synthesized',
  'locally-stale',
  'reconciliation-pending',
  'reconciled',
  'needs-claude',
  'inconsistent',
  'unreadable',
]
