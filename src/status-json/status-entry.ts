import type { DerivedState } from '../state/derived-state.ts'

/** What `clips status --json` keeps of one clip: its state and when it was
 * captured. Nothing that identifies or describes the clip. */
export type StatusEntry = {
  state: DerivedState
  /** Epoch milliseconds, or null for a clip with no readable clipped_at. */
  capturedAt: number | null
}
