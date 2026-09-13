import { runCodexTriageBatch } from './run-codex-triage-batch.ts'
import type { TriageRunner } from './triage-runner.ts'

/** codex on its own, with no second transport behind it.
 *
 * Every failure - including the credit wall - comes back as null, which
 * `parseTriageVerdicts` turns into an empty map and the caller turns into
 * `review`. That is the right shape for a run the operator pinned to codex with
 * `CLIPS_TRIAGE_RUNNER=codex`: it degrades, it does not silently change model.
 *
 * `runTriageWithFallback` is the default and wraps the same call, reacting to
 * the credit wall instead of swallowing it. */
export const runTriageCodex: TriageRunner = {
  run: async (batch) => (await runCodexTriageBatch(batch)).message,
}
