import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { WorkerExecutor } from './worker-executor.ts'

/** The executor a task profile in `<instance>/worker/config.json` reports when
 * it answers - its CLI as the provider and its pinned model, empty when it
 * pins none - or null when the instance defines no such profile.
 *
 * Read so the author/verifier guard can see which model a worker job will
 * actually reach: `worker` names a queue, not a model, and the profile is the
 * only place the model is written down. */
export const readWorkerProfileExecutor = (
  dataRoot: string,
  profile: string,
): WorkerExecutor | null => {
  const raw = JSON.parse(
    readFileSync(join(dataRoot, 'worker', 'config.json'), 'utf8'),
  ) as { profiles?: Record<string, { runner?: unknown; model?: unknown }> }
  const entry = raw.profiles?.[profile]
  if (typeof entry?.runner !== 'string') return null
  const model = typeof entry.model === 'string' ? entry.model : ''
  return { provider: entry.runner, model }
}
