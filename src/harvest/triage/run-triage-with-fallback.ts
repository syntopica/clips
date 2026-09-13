import { agyBulkTriage } from './agy-bulk-triage.ts'
import { runCodexTriageBatch } from './run-codex-triage-batch.ts'
import type { TriageRunner } from './triage-runner.ts'

/** codex first, agy when codex has run out of credits.
 *
 * The default since 2026-08-01, at the owner's direction: a workspace with no
 * credits left the harvest with no classifier at all, and waiting for a refill
 * is not a failure mode worth having.
 *
 * The trigger is narrow on purpose. Only the credit wall switches transport,
 * because it is the one codex failure that no retry clears. A timeout, a killed
 * process or an unparseable answer still returns null and degrades the batch to
 * `review` on codex, rather than re-running it on a different model and
 * presenting the result as if nothing changed.
 *
 * The switch is announced on stderr for the same reason. codex and agy do not
 * agree closely enough for the substitution to be invisible, so a run whose
 * verdicts came from Gemini has to say so where the operator will see it. */
export const runTriageWithFallback: TriageRunner = {
  run: async (batch) => {
    const codex = await runCodexTriageBatch(batch)
    if (!codex.outOfCredits) return codex.message
    process.stderr.write(
      'codex is out of credits - classifying this batch with agy instead. ' +
        'Verdicts in this run may come from two different models; ' +
        'refill the codex workspace or pin one with CLIPS_TRIAGE_RUNNER.\n',
    )
    return agyBulkTriage.run(batch)
  },
}
