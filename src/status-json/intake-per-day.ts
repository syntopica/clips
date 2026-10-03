import { DAY_MS } from './day-ms.ts'
import type { IntakeDay } from './intake-day.ts'
import { INTAKE_DAYS } from './intake-days.ts'
import { utcDay } from './utc-day.ts'

/** One entry per UTC day of the window, zero included, so a quiet day reads
 * as a zero rather than as a gap. Captures outside the window are ignored. */
export const intakePerDay = (
  capturedAt: readonly number[],
  now: Date,
): IntakeDay[] => {
  const days = Array.from({ length: INTAKE_DAYS }, (_, index) =>
    utcDay(now.getTime() - (INTAKE_DAYS - 1 - index) * DAY_MS),
  )
  const counts = new Map(days.map((day) => [day, 0]))
  for (const time of capturedAt) {
    const day = utcDay(time)
    const count = counts.get(day)
    if (count !== undefined) counts.set(day, count + 1)
  }
  return days.map((day) => ({ day, count: counts.get(day) ?? 0 }))
}
