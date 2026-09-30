/** What clips reads from the instance's worker configuration. */
export type WorkerInstance = {
  listen: string
  models: readonly string[]
}
