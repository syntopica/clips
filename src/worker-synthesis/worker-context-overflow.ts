import { WORKER_BYTES_PER_TOKEN } from './worker-bytes-per-token.ts'

/** Why a prompt cannot go to the worker model, or null when it fits.
 *
 * `context` is the worker's pinned window in tokens, null when the instance
 * names none - then nothing is refused here and the worker's own limits are
 * the only ones. The remedy names agy because its fine tier takes a prompt of
 * 512 KB, and codex and cursor are no longer synthesis routes. */
export const workerContextOverflow = (
  bytes: number,
  context: number | null,
): string | null => {
  if (context === null) return null
  const ceiling = context * WORKER_BYTES_PER_TOKEN
  if (bytes <= ceiling) return null
  return `the synthesis prompt and its answer need ${String(Math.round(bytes / 1024))} KB, over the ${String(Math.round(ceiling / 1024))} KB the worker model's ${String(context)}-token window holds; synthesize it with CLIPS_SYNTHESIS_RUNNER=agy-fine`
}
