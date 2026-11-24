import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import { localGradeOverflow } from '../grade/local-grade-overflow.ts'
import { awaitWorkerResult } from '../worker/await-worker-result.ts'
import { readWorkerModelContext } from '../worker/read-worker-model-context.ts'
import { submitWorkerJob } from '../worker/submit-worker-job.ts'
import { workerJobLeaseLost } from '../worker/worker-job-lease-lost.ts'
import { workerModel } from '../worker/worker-model.ts'
import { workerOutputText } from '../worker/worker-output-text.ts'
import type { WorkerTiming } from '../worker/worker-timing.ts'
import { workerNoEligibleExecutorFailure } from './worker-no-eligible-executor-failure.ts'
import { workerSynthesisDigest } from './worker-synthesis-digest.ts'
import type { WorkerSynthesisPort } from './worker-synthesis-port.ts'
import { workerSynthesisRequirements } from './worker-synthesis-requirements.ts'

/** Synthesis inference as jobs on a worker queue.
 *
 * An `inference` job, not a `task`: a task is read-only by contract and its
 * product is a message, never a file, and an inference job is a chat call with
 * no tools at all - the strongest boundary any synthesis transport here has had
 * against a clip carrying instructions. The model returns page contents and
 * this engine writes them, confined to the page directories.
 *
 * `personal`, because the prompt carries the wiki's own index and pages; the
 * instance's privacy table decides which executors that class may reach. The
 * model is the one the worker pins, or `CLIPS_WORKER_MODEL`, and the queue's
 * ladder decides who answers. A prompt over the local window is still sent,
 * because the remote rungs take a job first and can read all of it; an answer
 * the local model gave to such a prompt is discarded (2026-10-05: a 265 KB
 * writing prompt was refused up front although the ladder would have routed it
 * to a remote model).
 *
 * The key is the model, the step and the prompt, so a rerun collects the job a
 * previous run left queued instead of paying for it twice. `excluded` names
 * the executor providers the worker must never run the jobs on. */
export const workerSynthesisPortOnQueue = (
  queue: string,
  timing: WorkerTiming,
  environ: NodeJS.ProcessEnv = process.env,
  excluded: readonly string[] = [],
): WorkerSynthesisPort => ({
  excluding: (providers) =>
    workerSynthesisPortOnQueue(queue, timing, environ, providers),
  infer: async (step, prompt, schema, reserveBytes) => {
    const model = workerModel(environ)
    const digest = workerSynthesisDigest(model, step, prompt, excluded)
    const jobId = await submitWorkerJob({
      contract: 1,
      kind: 'inference',
      queue,
      idempotency_key: `synthesis-${step}:${digest}`,
      priority: 45,
      privacy: 'personal',
      max_attempts: 2,
      requirements: workerSynthesisRequirements(model, excluded),
      input: { messages: [{ role: 'user', content: prompt }], schema },
    })
    const result = await awaitWorkerResult(jobId, timing)
    const text = result === null ? null : workerOutputText(result.output)
    if (result === null && (await workerJobLeaseLost(jobId)))
      return {
        failure: `worker job ${jobId} on ${queue} lost its executor mid-job (lease_lost); the clip stays pending for the next run`,
        jobId,
        interrupted: true,
      }
    if (result === null || text === null)
      return (
        (await workerNoEligibleExecutorFailure(jobId, queue, excluded)) ?? {
          failure: `worker job ${jobId} on ${queue} ended without an answer; a rerun collects it by its key if it is still queued`,
          jobId,
        }
      )
    const executor = result.executor ?? null
    const overflow = localGradeOverflow(
      executor,
      Buffer.byteLength(prompt, 'utf8') + reserveBytes,
      readWorkerModelContext(currentSyntopicaConfig().dataRoot, model),
    )
    if (overflow !== null) return { failure: overflow, jobId, exhausted: true }
    return { text, executor, jobId }
  },
})
