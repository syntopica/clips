import type { WorkerExecutor } from '../worker/worker-executor.ts'
import { WORKER_AUTHOR_PREFIX } from './worker-author-prefix.ts'

/** The ledger's author for a page the worker wrote: the provider and model the
 * coordinator reported running, never the one this engine asked for.
 *
 * The request pins a model, but the queue decides what serves it, and the
 * author/verifier guard is only as good as the claim it is handed. A result
 * without an executor is recorded as `unreported`, which the grade lane does
 * not recognise and therefore refuses every tier for. */
export const workerAuthorModel = (executor: WorkerExecutor | null): string =>
  executor === null
    ? `${WORKER_AUTHOR_PREFIX}unreported`
    : `${WORKER_AUTHOR_PREFIX}${executor.provider}/${executor.model}`
