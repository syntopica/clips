import { createHash } from 'node:crypto'
import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import { awaitWorkerOutput } from '../worker/await-worker-output.ts'
import { submitWorkerJob } from '../worker/submit-worker-job.ts'
import { workerTaskInputs } from '../worker/worker-task-inputs.ts'
import { EVIDENCE_BYTE_BUDGET } from './evidence-byte-budget.ts'
import { GRADE_OUTPUT_SCHEMA } from './grade-output-schema.ts'
import { gradePrompt } from './grade-prompt.ts'
import type { GradeRunner } from './grade-runner.ts'

/** Grading as a `task` job on the worker's `clips.grade` queue.
 *
 * The page and its evidence travel as a manifest relative to the instance
 * root; the worker copies exactly those files into an empty workspace and runs
 * the profile's CLI there, so the grader reads the cited sources and nothing
 * else - narrower than the direct codex grader, which is pointed at the whole
 * brain repository.
 *
 * `runner` is sent with the job so the coordinator refuses it if the profile
 * has been repointed since the author/verifier guard read it.
 *
 * A job that ends without an answer comes back as a failed run carrying no
 * message, which the grade lane reports as an ungraded page. */
export const workerGradeRunner = (
  runner: string,
  timing: { pollMs: number; waitMs: number },
): GradeRunner => ({
  evidenceCeilingBytes: EVIDENCE_BYTE_BUDGET,
  run: async (_root, pagePath, evidencePaths) => {
    const inputs = workerTaskInputs(currentSyntopicaConfig().dataRoot, [
      pagePath,
      ...evidencePaths,
    ])
    if (typeof inputs === 'string')
      return { exitCode: 1, lastMessage: null, stderrTail: inputs }
    const [page = '', ...evidence] = inputs
    const prompt = gradePrompt(page, evidence)
    const digest = createHash('sha256')
      .update(`${prompt}\n${inputs.join('\n')}`)
      .digest('hex')
    const jobId = await submitWorkerJob({
      contract: 1,
      kind: 'task',
      queue: 'clips.grade',
      idempotency_key: `grade:${digest}`,
      priority: 40,
      privacy: 'internal',
      max_attempts: 2,
      input: {
        runner,
        profile: 'clips.grade',
        prompt,
        inputs,
        output_schema: GRADE_OUTPUT_SCHEMA,
      },
    })
    const answer = await awaitWorkerOutput(jobId, timing)
    return answer === null
      ? {
          exitCode: 1,
          lastMessage: null,
          stderrTail: `worker job ${jobId} ended without an answer`,
        }
      : { exitCode: 0, lastMessage: answer, stderrTail: '' }
  },
})
