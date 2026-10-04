import type { ClipRunOutcome } from './clip-run-outcome.ts'
import type { RunUsage } from './run-usage.ts'

/** One synthesis run of one clip, as `clips status --json --items` reports it.
 * Nothing here is clip content: the model and boundary are the transport's
 * identity, the job ids are the worker's own, and usage is counts. */
export type ClipRun = {
  startedAt: string
  durationMs: number
  outcome: ClipRunOutcome
  model: string
  boundary: string
  workerJobIds: string[]
  usage: RunUsage | null
}
