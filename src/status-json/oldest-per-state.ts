import type { NonTerminalState } from '../state/non-terminal-state.ts'
import { NON_TERMINAL_STATES } from '../state/non-terminal-states.ts'
import type { StatusEntry } from './status-entry.ts'

export const oldestPerState = (
  entries: readonly StatusEntry[],
): Record<NonTerminalState, string | null> =>
  Object.fromEntries(
    NON_TERMINAL_STATES.map((state) => {
      const times = entries.flatMap((entry) =>
        entry.state === state && entry.capturedAt !== null
          ? [entry.capturedAt]
          : [],
      )
      return [
        state,
        times.length === 0
          ? null
          : new Date(
              times.reduce((oldest, time) => Math.min(oldest, time)),
            ).toISOString(),
      ]
    }),
  ) as Record<NonTerminalState, string | null>
