import { workerRefineRunner } from './run-refine-worker.ts'
import type { TriageRunner } from './triage-runner.ts'

/** The harvest's worker refinement transport. Polls every 10 s for up to 45
 * minutes: room for a codex answer plus a node that yields to its user. */
export const workerRefine: TriageRunner = workerRefineRunner({
  pollMs: 10_000,
  waitMs: 45 * 60_000,
})
