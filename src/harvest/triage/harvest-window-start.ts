import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { isHarvestDate } from '../is-harvest-date.ts'
import { defaultWindowStart } from './default-window-start.ts'
import { NEWSLETTER_SWEEP_MARKER } from './newsletter-sweep-marker.ts'
import { triageRootPath } from './triage-root-path.ts'

/** The date the newsletter sweep reads mail from: the most recent run that
 * actually read newsletters, or `defaultWindowStart` when there is none.
 *
 * Spark's one-day cache used to bound this run by accident. Reading Vexa
 * reaches the whole archive, and an unbounded sweep would re-classify
 * everything already triaged - the 2026-07-30 run alone covered 1499 articles
 * from 188 emails, and classification is the first stage that spends quota.
 *
 * Only a directory carrying `NEWSLETTER_SWEEP_MARKER` counts, because a dated
 * directory on its own proves nothing about newsletters - see that constant for
 * the two ways one gets written without any being read.
 *
 * The bound is inclusive of the previous run's own day, so mail that arrived
 * after that run started is swept again rather than lost. Overlap costs a
 * deduplication pass; a gap costs the articles. */
export const harvestWindowStart = (
  brainRepository: string,
  before: string,
): string => {
  const root = triageRootPath(brainRepository)
  if (!existsSync(root)) return defaultWindowStart(before)
  const previous = readdirSync(root)
    .filter(
      (entry) =>
        isHarvestDate(entry) &&
        entry < before &&
        existsSync(join(root, entry, NEWSLETTER_SWEEP_MARKER)),
    )
    .toSorted()
    .at(-1)
  return previous ?? defaultWindowStart(before)
}
