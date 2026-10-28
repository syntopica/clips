import type { WorkerSelectionOutcome } from './worker-selection-outcome.ts'

/** The selection outcome that stops the clip before the writing pass. */
export type WorkerSelectionRefusal = Extract<
  WorkerSelectionOutcome,
  { refusal: string }
>
