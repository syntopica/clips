import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { WorkerInstance } from './worker-instance.ts'

/** The coordinator address and pinned models from `<instance>/worker/config.json`.
 *
 * `worker` sits at the instance root because the configuration schema has no
 * `worker` section, so the worker engine's own `worker.path` lookup always
 * lands there. A missing `listen` takes the worker loader's documented
 * `127.0.0.1:8765`, so clips reaches the same address the coordinator binds. */
export const readWorkerInstance = (dataRoot: string): WorkerInstance => {
  const raw = JSON.parse(
    readFileSync(join(dataRoot, 'worker', 'config.json'), 'utf8'),
  ) as { listen?: unknown; models?: unknown }
  return {
    listen: typeof raw.listen === 'string' ? raw.listen : '127.0.0.1:8765',
    models:
      typeof raw.models === 'object' && raw.models !== null
        ? Object.keys(raw.models)
        : [],
  }
}
