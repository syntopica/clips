import { agyFineTriage } from './agy-fine-triage.ts'
import { runCodexTriageBatch } from './run-codex-triage-batch.ts'
import type { TriageRunner } from './triage-runner.ts'

/** codex first, Claude through agy when the codex workspace is empty. The
 * refinement half of the harvest, and the mirror of `runTriageWithFallback`,
 * which does the same for the bulk half in the other direction.
 *
 * Only the credit wall switches transport. A timeout or an unreadable answer
 * returns null and degrades that batch to `review` on codex, rather than being
 * re-answered by a different model and presented as if nothing changed. */
export const runRefineWithFallback: TriageRunner = {
  run: async (batch) => {
    const codex = await runCodexTriageBatch(batch)
    if (!codex.outOfCredits) return codex.message
    process.stderr.write(
      'codex is out of credits - refining with Claude through agy instead. ' +
        'Verdicts in this run may come from two different models; pin one with ' +
        'CLIPS_TRIAGE_REFINER.\n',
    )
    return agyFineTriage.run(batch)
  },
}
