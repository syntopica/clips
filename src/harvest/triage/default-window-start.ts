import { harvestDate } from '../harvest-date.ts'
import { NEWSLETTER_BACKFILL_DAYS } from './newsletter-backfill-days.ts'

/** The floor a sweep reads from when no previous newsletter run is on disk:
 * `NEWSLETTER_BACKFILL_DAYS` before the run date, in UTC like every other date
 * this lane handles. */
export const defaultWindowStart = (before: string): string =>
  harvestDate(
    new Date(
      Date.parse(`${before}T00:00:00Z`) -
        NEWSLETTER_BACKFILL_DAYS * 24 * 60 * 60 * 1000,
    ),
  )
