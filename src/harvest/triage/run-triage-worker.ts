import { createHash } from 'node:crypto'
import { currentSyntopicaConfig } from '../../config/current-syntopica-config.ts'
import { awaitWorkerOutput } from '../../worker/await-worker-output.ts'
import { submitWorkerJob } from '../../worker/submit-worker-job.ts'
import { configuredTriageTopics } from './configured-triage-topics.ts'
import { triageOutputSchema } from './triage-output-schema.ts'
import { triagePrompt } from './triage-prompt.ts'
import type { TriageRunner } from './triage-runner.ts'

/** Triage as an inference job on the worker queue, so bulk classification runs
 * on the owner's own model through the one process that arbitrates it, rather
 * than spending agy or codex quota.
 *
 * Same prompt and schema as the other transports; the schema goes to the model
 * server as its output format and the coordinator validates the answer against
 * it. The job is `personal` because the prompt carries the instance's triage
 * profile, which keeps it on local executors on the owner's machines. It is
 * also the strongest boundary this stage has had against an injected title: a
 * chat call with no tools at all.
 *
 * The model is `CLIPS_WORKER_MODEL`, read at call time: the worker only runs
 * models its instance pins, and which one that is belongs to the instance.
 * The queue name is this engine's, and the instance grants it to a producer.
 *
 * `waitMs` covers a queue that is not reached at once - the node yields to its
 * user and to memory pressure. When it runs out the batch degrades to
 * `review`, and a rerun collects the same job by its key. */
export const workerTriageRunner = (
  timing: { pollMs: number; waitMs: number },
  environ: NodeJS.ProcessEnv = process.env,
): TriageRunner => ({
  run: async (batch) => {
    const model = environ['CLIPS_WORKER_MODEL']
    if (model === undefined || model === '')
      throw new Error(
        'The worker transport needs CLIPS_WORKER_MODEL, a model the worker instance pins.',
      )
    const topics = configuredTriageTopics()
    const prompt = triagePrompt(
      batch,
      currentSyntopicaConfig().triageProfile,
      topics,
    )
    const digest = createHash('sha256')
      .update(`${model}\n${prompt}`)
      .digest('hex')
    const jobId = await submitWorkerJob({
      contract: 1,
      kind: 'inference',
      queue: 'clips.triage',
      idempotency_key: `triage:${digest}`,
      priority: 50,
      privacy: 'personal',
      max_attempts: 2,
      requirements: { capability: 'chat.json', models: [model] },
      input: {
        messages: [{ role: 'user', content: prompt }],
        schema: triageOutputSchema(topics),
        options: { temperature: 0 },
      },
    })
    return awaitWorkerOutput(jobId, timing)
  },
})
