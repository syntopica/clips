import { WORKER_BYTES_PER_TOKEN } from '../worker-synthesis/worker-bytes-per-token.ts'
import type { WorkerExecutor } from '../worker/worker-executor.ts'

/** Why a grade the local model answered cannot be trusted because the prompt
 * outgrew its window, or null when it fit or another executor answered.
 *
 * The ladder hands a job to the local model only after the remote rungs had
 * `local_after_s` to take it, and the local window is far smaller than agy's
 * prompt ceiling. Ollama truncates an oversized prompt without saying so, from
 * the head - where the sources and the untrusted-data warning are - so the
 * answer would read like a verdict on evidence the model never saw. Discarded
 * after the fact rather than refused up front, because refusing would also
 * take the page away from the remote rungs that can read all of it.
 * `context` is the worker's pinned window in tokens, null when it names none. */
export const localGradeOverflow = (
  executor: WorkerExecutor | null,
  promptBytes: number,
  context: number | null,
): string | null => {
  const provider = executor?.provider
  if (provider !== 'ollama' && provider !== 'local-cpu') return null
  if (context === null || promptBytes <= context * WORKER_BYTES_PER_TOKEN)
    return null
  return `the local model answered a ${String(Math.round(promptBytes / 1024))} KB prompt its ${String(context)}-token window cannot hold, so the verdict was discarded`
}
