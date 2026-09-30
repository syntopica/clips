/** Which node, provider and model answered a job, as the coordinator reports
 * it on a result row. For an inference job the provider is the backend
 * (`ollama`), for a task it is the runner CLI. */
export type WorkerExecutor = {
  node?: string
  provider: string
  model: string
}
