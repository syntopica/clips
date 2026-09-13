import type { ClipOutcome } from './clip-outcome.ts'
import { outcomeBreakdown } from './outcome-breakdown.ts'

/** The closing line of an ingest run, and the only place a run that did nothing
 * says so.
 *
 * Until now the loop printed one line per clip that did something and nothing
 * otherwise, so a `--clip` filter matching no clip - a typo, an id already
 * reconciled, a capture demoted by a later verdict - ended in silence and exit
 * 0, which reads as a successful ingest. openwiki takes pre- and post-run
 * snapshots for the same reason; this is the cheap version of it, counting what
 * the loop already knows.
 *
 * `published`, `reconciled` and `needs-claude` are the outcomes that write to a
 * repository. A run made only of the others examined clips and changed nothing,
 * which is a result worth a sentence rather than an absence. */
export const formatIngestSummary = (
  matched: number,
  outcomes: readonly ClipOutcome[],
  clipFilter: string | null,
): string => {
  if (matched === 0)
    return clipFilter === null
      ? 'no clips to ingest; nothing was ingested\n'
      : `no clip matched --clip ${clipFilter}; nothing was ingested\n`
  const breakdown = outcomeBreakdown(outcomes)
  const changed = outcomes.some(
    (outcome) =>
      outcome === 'published' ||
      outcome === 'reconciled' ||
      outcome === 'needs-claude',
  )
  if (changed) return `${String(matched)} clips examined: ${breakdown}\n`
  return breakdown === ''
    ? `${String(matched)} clips examined, nothing was ingested\n`
    : `${String(matched)} clips examined, nothing was ingested (${breakdown})\n`
}
