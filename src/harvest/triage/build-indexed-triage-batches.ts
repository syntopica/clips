import { buildTriageBatchLine } from './build-triage-batch-line.ts'
import { TRIAGE_BATCH_SIZE } from './triage-batch-size.ts'
import type { TriageEntry } from './triage-entry.ts'

/** Slice already-indexed entries into TSV batches.
 *
 * The index written on each line is the article's position in the full
 * harvested list, never its position in the batch, so a verdict can be matched
 * back without tracking batch offsets - and so a refinement pass over a
 * scattered subset produces verdicts keyed the same way the bulk pass did. */
export const buildIndexedTriageBatches = (
  entries: readonly TriageEntry[],
): string[] => {
  const batches: string[] = []
  for (let start = 0; start < entries.length; start += TRIAGE_BATCH_SIZE) {
    batches.push(
      entries
        .slice(start, start + TRIAGE_BATCH_SIZE)
        .map(buildTriageBatchLine)
        .join('\n'),
    )
  }
  return batches
}
