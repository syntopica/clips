import type { DerivedState } from './derived-state.ts'

/** The state and the observation that produced it. `clips status` prints both,
 * because a state with no evidence is not reviewable. */
export type StateEvidence = { state: DerivedState; reason: string }
