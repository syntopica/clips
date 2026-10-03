import type { DerivedState } from './derived-state.ts'

/** Every state but `reconciled` still waits on something: the pipeline, a
 * person, or a repair. */
export type NonTerminalState = Exclude<DerivedState, 'reconciled'>
