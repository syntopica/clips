import { countStates } from './count-states.ts'
import { intakePerDay } from './intake-per-day.ts'
import { oldestPerState } from './oldest-per-state.ts'
import type { StatusDocument } from './status-document.ts'
import type { StatusEntry } from './status-entry.ts'

export const buildStatusDocument = (
  entries: readonly StatusEntry[],
  now: Date,
): StatusDocument => {
  const dated = entries.flatMap((entry) =>
    entry.capturedAt === null ? [] : [entry.capturedAt],
  )
  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    total: entries.length,
    states: countStates(entries),
    oldestAt: oldestPerState(entries),
    intake: {
      days: intakePerDay(dated, now),
      undated: entries.length - dated.length,
    },
  }
}
