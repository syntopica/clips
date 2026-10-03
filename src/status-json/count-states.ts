import type { DerivedState } from '../state/derived-state.ts'
import { DERIVED_STATES } from '../state/derived-states.ts'
import type { StatusEntry } from './status-entry.ts'

export const countStates = (
  entries: readonly StatusEntry[],
): Record<DerivedState, number> => {
  const counts = Object.fromEntries(
    DERIVED_STATES.map((state) => [state, 0]),
  ) as Record<DerivedState, number>
  for (const entry of entries) counts[entry.state] += 1
  return counts
}
