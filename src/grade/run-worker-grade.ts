import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'
import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import { awaitWorkerResult } from '../worker/await-worker-result.ts'
import { readWorkerMaxPayloadBytes } from '../worker/read-worker-max-payload-bytes.ts'
import { submitWorkerJob } from '../worker/submit-worker-job.ts'
import { workerModel } from '../worker/worker-model.ts'
import { AGY_EVIDENCE_CEILING_BYTES } from './agy-evidence-ceiling-bytes.ts'
import type { GradeRunner } from './grade-runner.ts'
import { readInlineSources } from './read-inline-sources.ts'
import { workerGradeAnswer } from './worker-grade-answer.ts'
import { workerGradeJob } from './worker-grade-job.ts'
import { workerGradePrompt } from './worker-grade-prompt.ts'

/** Grading as an `inference` job on the worker's `clips.grade` queue.
 *
 * A chat call with no tools, so the page and its evidence are inlined into
 * the prompt, and the strongest boundary any grader here has had against a
 * clip carrying instructions. Which model answers is the queue's executor
 * ladder's decision, so the author/verifier split and the local window are
 * checked against the executor the coordinator reports, and a verdict that
 * fails either is discarded as an ungraded page - never reported as clean.
 *
 * Two bounds keep the inlined evidence sendable. Pre-flight, the evidence may
 * not exceed `AGY_EVIDENCE_CEILING_BYTES` (512 KB), because the first rung
 * runs agy with the prompt in one argv and that is the size measured working
 * there. Then the whole job body, page and JSON escaping included, must fit
 * the coordinator's `max_payload_bytes` (1 MiB unless the instance says
 * otherwise); over it the page is refused with both numbers.
 *
 * `forbidden` is the tiers that wrote the batch, or null where no author is
 * known. A job that ends without an answer comes back as a failed run carrying
 * no message, which the grade lane reports as an ungraded page. */
export const workerGradeRunner = (
  forbidden: readonly string[] | null,
  timing: { pollMs: number; waitMs: number },
  environ: NodeJS.ProcessEnv = process.env,
): GradeRunner => ({
  evidenceCeilingBytes: AGY_EVIDENCE_CEILING_BYTES,
  run: async (root, pagePath, evidencePaths) => {
    const pageText = await readFile(pagePath, 'utf8').catch(() => null)
    if (pageText === null)
      return { exitCode: 1, lastMessage: null, stderrTail: 'page not readable' }
    const prompt = workerGradePrompt(
      relative(root, pagePath) || pagePath,
      pageText,
      await readInlineSources(root, evidencePaths),
    )
    const { dataRoot } = currentSyntopicaConfig()
    const model = workerModel(environ)
    const job = workerGradeJob(model, prompt)
    const bytes = Buffer.byteLength(JSON.stringify(job), 'utf8')
    const limit = readWorkerMaxPayloadBytes(dataRoot)
    if (bytes > limit)
      return {
        exitCode: 1,
        lastMessage: null,
        stderrTail: `the grade job is ${String(bytes)} bytes, over the worker's ${String(limit)}-byte max_payload_bytes`,
      }
    const jobId = await submitWorkerJob(job)
    return workerGradeAnswer(jobId, await awaitWorkerResult(jobId, timing), {
      forbidden,
      promptBytes: Buffer.byteLength(prompt, 'utf8'),
      dataRoot,
      model,
    })
  },
})
