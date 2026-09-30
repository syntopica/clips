import { createHash } from 'node:crypto'
import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import { awaitWorkerResult } from '../worker/await-worker-result.ts'
import { readWorkerModelContext } from '../worker/read-worker-model-context.ts'
import { submitWorkerJob } from '../worker/submit-worker-job.ts'
import { workerModel } from '../worker/worker-model.ts'
import { workerOutputText } from '../worker/worker-output-text.ts'
import { workerContextOverflow } from './worker-context-overflow.ts'
import type { WorkerSynthesisPort } from './worker-synthesis-port.ts'

/** Synthesis inference as jobs on a worker queue.
 *
 * An `inference` job, not a `task`: a task is read-only by contract and its
 * product is a message, never a file, and an inference job is a chat call with
 * no tools at all - the strongest boundary any synthesis transport here has had
 * against a clip carrying instructions. The model returns page contents and
 * this engine writes them, confined to the page directories.
 *
 * `personal`, because the prompt carries the wiki's own index and pages; that
 * class keeps the job on the owner's local executors. The model is the one the
 * worker pins, or `CLIPS_WORKER_MODEL`, and the prompt is refused before it is
 * sent when it would not fit that model's window with room for the answer.
 *
 * The key is the model, the step and the prompt, so a rerun collects the job a
 * previous run left queued instead of paying for it twice. */
export const workerSynthesisPortOnQueue = (
  queue: string,
  timing: { pollMs: number; waitMs: number },
  environ: NodeJS.ProcessEnv = process.env,
): WorkerSynthesisPort => ({
  infer: async (step, prompt, schema, reserveBytes) => {
    const model = workerModel(environ)
    const context = readWorkerModelContext(
      currentSyntopicaConfig().dataRoot,
      model,
    )
    const overflow = workerContextOverflow(
      Buffer.byteLength(prompt, 'utf8') + reserveBytes,
      context,
    )
    if (overflow !== null) return { failure: overflow }
    const digest = createHash('sha256')
      .update(`${model}\n${step}\n${prompt}`)
      .digest('hex')
    const jobId = await submitWorkerJob({
      contract: 1,
      kind: 'inference',
      queue,
      idempotency_key: `synthesis-${step}:${digest}`,
      priority: 45,
      privacy: 'personal',
      max_attempts: 2,
      requirements: { capability: 'chat.json', models: [model] },
      input: { messages: [{ role: 'user', content: prompt }], schema },
    })
    const result = await awaitWorkerResult(jobId, timing)
    const text = result === null ? null : workerOutputText(result.output)
    if (result === null || text === null)
      return {
        failure: `worker job ${jobId} on ${queue} ended without an answer; a rerun collects it by its key if it is still queued`,
      }
    return { text, executor: result.executor ?? null }
  },
})
