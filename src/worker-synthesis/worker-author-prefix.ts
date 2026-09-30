/** How a worker-written page's author begins in the ledger:
 * `worker:<provider>/<model>`, for example `worker:ollama/qwen3.6:35b`. Shared
 * with the grade lane, which reads the provider back to know which tier the
 * author occupies. */
export const WORKER_AUTHOR_PREFIX = 'worker:'
