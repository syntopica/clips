import type { DerivedState } from '../state/derived-state.ts'
import type { NonTerminalState } from '../state/non-terminal-state.ts'
import type { IntakeDay } from './intake-day.ts'
import type { StatusItem } from './status-item.ts'

/** `clips status --json`. Counts and timestamps only: a clip id, title, url or
 * any text from a clip never appears here, because orbit stores and streams
 * this document as non-content (orbit design 6.6). */
export type StatusDocument = {
  schemaVersion: 1
  generatedAt: string
  total: number
  states: Record<DerivedState, number>
  /** Capture time of the oldest clip in each state that still waits on
   * something; null when the state is empty or none of its clips is dated. */
  oldestAt: Record<NonTerminalState, string | null>
  intake: {
    /** Clips captured per UTC day, oldest day first, ending today. */
    days: IntakeDay[]
    /** Clips with no readable capture time, which no day can count. */
    undated: number
  }
  /** Present only with `--items`: one entry per waiting clip and per recently
   * reconciled one, built under the same rule as the counts. */
  items?: StatusItem[]
}
