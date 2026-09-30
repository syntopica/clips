import type { WorkerResult } from './worker-result.ts'

/** A result's output as the text a transport hands back: the validated JSON
 * re-serialised when there is one, the raw text otherwise. */
export const workerOutputText = (
  output: WorkerResult['output'],
): string | null =>
  output?.json !== undefined
    ? JSON.stringify(output.json)
    : (output?.text ?? null)
