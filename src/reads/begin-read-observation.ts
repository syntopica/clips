import { pageAtimes } from './page-atimes.ts'
import type { ReadObservation } from './read-observation.ts'
import { READ_PROBE_PAGE } from './read-probe-page.ts'
import { recordsReads } from './records-reads.ts'

/** Snapshot the worktree's page access times, after asking the filesystem
 * whether it records reads at all. Called immediately before the synthesizer
 * runs, so anything the transport opens afterwards advances past this baseline.
 *
 * The probe runs first and the baseline second, which is the ordering that
 * makes the probe free: its own read is already in the baseline and cannot be
 * mistaken for the model's. */
export const beginReadObservation = async (
  worktree: string,
): Promise<ReadObservation> => {
  if (!(await recordsReads(worktree, READ_PROBE_PAGE)))
    return { observable: false }
  return { observable: true, baseline: await pageAtimes(worktree) }
}
