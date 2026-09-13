import type { ClipOutcome } from './clip-outcome.ts'

/** The run's outcomes as `2 published, 1 skipped`, in a fixed order and with
 * the zeros left out. Empty when no clip reached the pipeline at all, which the
 * caller reports as its own sentence rather than as an empty list. */
export const outcomeBreakdown = (outcomes: readonly ClipOutcome[]): string =>
  (
    [
      'published',
      'reconciled',
      'needs-claude',
      'skipped',
      'stopped',
      'quit',
    ] as const
  )
    .map((outcome) => ({
      outcome,
      count: outcomes.filter((each) => each === outcome).length,
    }))
    .filter((entry) => entry.count > 0)
    .map((entry) => `${String(entry.count)} ${entry.outcome}`)
    .join(', ')
