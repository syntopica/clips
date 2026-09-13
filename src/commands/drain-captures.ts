import type { UndrainedCapture } from '../capture/undrained-capture.ts'
import { drainCapture } from './drain-capture.ts'
import type { DrainCounts } from './drain-counts.ts'

/** Drain every capture in turn and count what each produced. One capture
 * failing costs that capture and leaves it in the inbox; the rest continue,
 * which is the same shape `promoteArticles` has for the same reason. */
export const drainCaptures = async (
  captures: readonly UndrainedCapture[],
  clipsRepository: string,
  clippedKeys: ReadonlySet<string>,
): Promise<DrainCounts> => {
  const counts: DrainCounts = {
    clipped: 0,
    alreadyClipped: 0,
    withoutBody: 0,
    failed: 0,
  }
  for (const capture of captures) {
    try {
      const outcome = await drainCapture({
        capture,
        clipsRepository,
        clippedKeys,
      })
      if (outcome.kind === 'clipped') counts.clipped += 1
      else if (outcome.kind === 'already-clipped') counts.alreadyClipped += 1
      else {
        counts.withoutBody += 1
        process.stdout.write(
          `  no body  ${capture.url}: ${outcome.reason ?? ''}\n`,
        )
      }
    } catch (error) {
      // Reached only when writing the clip or marking it drained fails, since
      // fetching and extracting report rather than throw. Those are local
      // faults worth retrying, so the capture stays in the inbox.
      counts.failed += 1
      process.stderr.write(
        `  failed ${capture.url}: ${error instanceof Error ? error.message : String(error)}\n`,
      )
    }
  }
  return counts
}
