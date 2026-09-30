import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** The context window, in tokens, the instance's worker pins for `model`, or
 * null when its configuration names no `num_ctx` for it.
 *
 * Read so a producer can refuse a prompt the model would never see whole: a
 * local model's window is fixed by the worker - every client of one Ollama
 * server has to send the same `num_ctx`, or the server reloads the model under
 * the other client's request - so it is the worker's number, not this
 * engine's, that bounds a job. */
export const readWorkerModelContext = (
  dataRoot: string,
  model: string,
): number | null => {
  const raw = JSON.parse(
    readFileSync(join(dataRoot, 'worker', 'config.json'), 'utf8'),
  ) as { models?: Record<string, { num_ctx?: unknown }> }
  const context = raw.models?.[model]?.num_ctx
  return typeof context === 'number' && context > 0 ? context : null
}
