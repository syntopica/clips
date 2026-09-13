/** One ticked article a promote run tried to fetch and could not.
 *
 * `attempts` is the whole point of persisting this: Medium's 403s are
 * intermittent, so a single failure says nothing while eight say the article
 * is effectively unreachable and the batch should stop waiting for it. The
 * topic and title travel with it so the outstanding list is readable without
 * reopening the triage files. */
export type PromoteFailure = {
  url: string
  title: string
  topic: string
  attempts: number
  lastError: string
  lastAttemptAt: string
}
