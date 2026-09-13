import { harvestDate } from './harvest-date.ts'

/** Whether a string names a real calendar day in the `YYYY-MM-DD` shape the
 * triage directories are filed under.
 *
 * The round-trip is what rejects `2026-02-31`: a shape-only regex accepts it,
 * `new Date` rolls it over to March, and the caller would be sent to a
 * directory nobody ever wrote. */
export const isHarvestDate = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  harvestDate(new Date(`${value}T00:00:00Z`)) === value
