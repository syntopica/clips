import { DERIVED_STATES } from './derived-states.ts'
import type { NonTerminalState } from './non-terminal-state.ts'

export const NON_TERMINAL_STATES: readonly NonTerminalState[] =
  DERIVED_STATES.filter(
    (state): state is NonTerminalState => state !== 'reconciled',
  )
