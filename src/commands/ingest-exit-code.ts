import { EXIT_CODE } from '../cli/exit-code.ts'
import type { ClipOutcome } from './clip-outcome.ts'

/** How an ingest run ends: an exhausted transport first, because the caller
 * has to stop rather than try the next clip, then any stopped clip. */
export const ingestExitCode = (
  outcomes: readonly ClipOutcome[],
  stopped: number,
): number => {
  if (outcomes.includes('exhausted')) return EXIT_CODE.exhausted
  return stopped === 0 ? EXIT_CODE.success : EXIT_CODE.clipsStopped
}
