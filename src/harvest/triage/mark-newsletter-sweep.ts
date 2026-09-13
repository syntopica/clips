import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { NEWSLETTER_SWEEP_MARKER } from './newsletter-sweep-marker.ts'

/** Record that this triage run read newsletters, and how far back it read.
 *
 * Written after the triage output, so a run that died before producing one
 * leaves no marker and the next run re-reads the same window. */
export const markNewsletterSweep = (
  directory: string,
  since: string,
  emailCount: number,
): void => {
  writeFileSync(
    join(directory, NEWSLETTER_SWEEP_MARKER),
    `${JSON.stringify({ since, emailCount }, null, 2)}\n`,
  )
}
