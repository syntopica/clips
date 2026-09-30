import { sha256Hex } from '../harvest/promote/sha256-hex.ts'
import type { SynthesisResult } from '../synthesis/synthesis-result.ts'
import { applyWorkerPageWrites } from './apply-worker-page-writes.ts'
import { listWorktreePages } from './list-worktree-pages.ts'
import { parseWorkerWriting } from './parse-worker-writing.ts'
import { workerAuthorModel } from './worker-author-model.ts'
import { WORKER_SYNTHESIS_BOUNDARY } from './worker-synthesis-boundary.ts'
import { workerSynthesisEscalation } from './worker-synthesis-escalation.ts'
import type { WorkerSynthesisPort } from './worker-synthesis-port.ts'
import type { WorkerWritingInput } from './worker-writing-input.ts'
import { workerWritingPrompt } from './worker-writing-prompt.ts'
import { workerWritingReserveBytes } from './worker-writing-reserve-bytes.ts'
import { WORKER_WRITING_SCHEMA } from './worker-writing-schema.ts'

/** The second worker pass: whole pages back, written into the worktree.
 *
 * `promptSha256` is of this pass's prompt, the one the pages were written
 * from. The author is the executor the coordinator reported for it, and stays
 * `unreported` when the job produced no answer at all. */
export const runWorkerWriting = async (
  port: WorkerSynthesisPort,
  input: WorkerWritingInput,
): Promise<SynthesisResult> => {
  const prompt = workerWritingPrompt({
    ...input,
    pagePaths: await listWorktreePages(input.worktree, input.directories),
  })
  const identity = {
    model: workerAuthorModel(null),
    promptSha256: sha256Hex(prompt),
    boundary: WORKER_SYNTHESIS_BOUNDARY,
  }
  const written = await port.infer(
    'write',
    prompt,
    WORKER_WRITING_SCHEMA,
    workerWritingReserveBytes(input.shown),
  )
  if ('failure' in written)
    return workerSynthesisEscalation(`writing: ${written.failure}`, identity)
  const author = { ...identity, model: workerAuthorModel(written.executor) }
  const writing = parseWorkerWriting(written.text)
  if (writing === null)
    return workerSynthesisEscalation(
      `the worker's pages were not parseable (PROMPT_OUTPUT_INVALID): ${written.text.slice(-300)}`,
      author,
    )
  if (writing.needs_claude)
    return workerSynthesisEscalation(writing.reason, author)
  const applied = await applyWorkerPageWrites(
    input.worktree,
    writing.pages,
    input.shown.map(({ path }) => path),
    input.directories,
  )
  if (typeof applied === 'string')
    return workerSynthesisEscalation(
      `the worker's pages were refused: ${applied}`,
      author,
    )
  return {
    pagesTouched: applied,
    needsClaude: false,
    skipped: false,
    reason: writing.reason,
    identity: author,
  }
}
