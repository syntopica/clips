import { workerTriageRunner } from './run-triage-worker.ts'
import type { TriageRunner } from './triage-runner.ts'

/** The harvest's worker transport. Polls every 10 s for up to 45 minutes: a
 * 250-title batch is minutes of generation on a warm local model, and the
 * rest is room for the node to wait out its user or memory pressure. */
export const workerTriage: TriageRunner = workerTriageRunner({
  pollMs: 10_000,
  waitMs: 45 * 60_000,
})
