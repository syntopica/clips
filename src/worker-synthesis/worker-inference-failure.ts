/** An inference job that produced no answer, and why. `exhausted` marks a
 * failure that says nothing about the clip: the remote rungs were spent and
 * the local model answered a prompt its window could not hold. */
export type WorkerInferenceFailure = {
  failure: string
  jobId?: string
  exhausted?: true
}
