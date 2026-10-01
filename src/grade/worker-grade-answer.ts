import type { CodexRunResult } from '../codex/codex-run-result.ts'
import { readWorkerModelContext } from '../worker/read-worker-model-context.ts'
import { workerOutputText } from '../worker/worker-output-text.ts'
import type { WorkerResult } from '../worker/worker-result.ts'
import { graderAuthorRefusal } from './grader-author-refusal.ts'
import { localGradeOverflow } from './local-grade-overflow.ts'

/** A worker grade job's result as the grade lane's run result: the answer when
 * one came back and the executor that gave it may stand, a failed run naming
 * why otherwise. A failure carries no message, so the page is reported
 * ungraded and never clean. */
export const workerGradeAnswer = (
  jobId: string,
  result: WorkerResult | null,
  check: {
    forbidden: readonly string[] | null
    promptBytes: number
    dataRoot: string
    model: string
  },
): CodexRunResult => {
  const answer = result === null ? null : workerOutputText(result.output)
  if (result === null || answer === null)
    return {
      exitCode: 1,
      lastMessage: null,
      stderrTail: `worker job ${jobId} ended without an answer`,
    }
  const executor = result.executor ?? null
  const refusal =
    graderAuthorRefusal(executor, check.forbidden) ??
    localGradeOverflow(
      executor,
      check.promptBytes,
      readWorkerModelContext(check.dataRoot, executor?.model ?? check.model),
    )
  return refusal === null
    ? { exitCode: 0, lastMessage: answer, stderrTail: '' }
    : {
        exitCode: 1,
        lastMessage: null,
        stderrTail: `worker job ${jobId}: ${refusal}`,
      }
}
