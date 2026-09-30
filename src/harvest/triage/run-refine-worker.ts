import { createHash } from 'node:crypto'
import { currentSyntopicaConfig } from '../../config/current-syntopica-config.ts'
import { awaitWorkerOutput } from '../../worker/await-worker-output.ts'
import { submitWorkerJob } from '../../worker/submit-worker-job.ts'
import { configuredTriageTopics } from './configured-triage-topics.ts'
import { triageOutputSchema } from './triage-output-schema.ts'
import { triagePrompt } from './triage-prompt.ts'
import type { TriageRunner } from './triage-runner.ts'

/** The refinement pass as a `task` job on the worker, so the second opinion on
 * the uncertain tail runs through the one process that arbitrates every agent
 * CLI on the machine - and waits out a credit wall there - instead of each
 * harvest racing codex on its own.
 *
 * The instance's `clips.refine` profile names the CLI, model and effort; the
 * engine only names the profile and hands over the same prompt and schema as
 * the other transports. The job carries no input files, so the CLI sees the
 * titles and nothing of the filesystem.
 *
 * `internal`, not `personal`: the prompt holds the triage profile, which the
 * codex refiner has always sent to its provider. A cloud CLI is what this pass
 * is for; the local model already did the first one.
 *
 * `waitMs` covers a queue parked behind a quota wall. When it runs out the
 * batch keeps its first-pass verdict, and a rerun collects the same job by its
 * key. */
export const workerRefineRunner = (timing: {
  pollMs: number
  waitMs: number
}): TriageRunner => ({
  run: async (batch) => {
    const topics = configuredTriageTopics()
    const prompt = triagePrompt(
      batch,
      currentSyntopicaConfig().triageProfile,
      topics,
    )
    const digest = createHash('sha256').update(prompt).digest('hex')
    const jobId = await submitWorkerJob({
      contract: 1,
      kind: 'task',
      queue: 'clips.refine',
      idempotency_key: `refine:${digest}`,
      priority: 50,
      privacy: 'internal',
      max_attempts: 2,
      input: {
        profile: 'clips.refine',
        prompt,
        inputs: [],
        output_schema: triageOutputSchema(topics),
      },
    })
    return awaitWorkerOutput(jobId, timing)
  },
})
