import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** The CLI a task profile in `<instance>/worker/config.json` runs, or null when
 * the instance defines no such profile.
 *
 * Read so the author/verifier guard can see which model a worker job will
 * actually reach: `worker` names a queue, not a model, and the profile is the
 * only place the model is written down. */
export const readWorkerProfileRunner = (
  dataRoot: string,
  profile: string,
): string | null => {
  const raw = JSON.parse(
    readFileSync(join(dataRoot, 'worker', 'config.json'), 'utf8'),
  ) as { profiles?: Record<string, { runner?: unknown }> }
  const runner = raw.profiles?.[profile]?.runner
  return typeof runner === 'string' ? runner : null
}
