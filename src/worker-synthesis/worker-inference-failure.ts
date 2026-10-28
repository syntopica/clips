/** An inference job that produced no answer, and why. `exhausted` and
 * `interrupted` mark failures that say nothing about the clip: `exhausted` the
 * remote rungs spent and the local model answering a prompt its window could
 * not hold, `interrupted` the executor lost mid-job. */
export type WorkerInferenceFailure = {
  failure: string
  jobId?: string
  exhausted?: true
  interrupted?: true
}
