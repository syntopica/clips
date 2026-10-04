import type { DerivedState } from './derived-state.ts'
import type { StateReasonCode } from './state-reason-code.ts'

/** The state and the observation that produced it. `clips status` prints both,
 * because a state with no evidence is not reviewable. */
export type StateEvidence = {
  state: DerivedState
  code: StateReasonCode
  reason: string
}
