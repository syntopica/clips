import { commitStagedChanges } from '../git/commit-staged-changes.ts'
import { pushClipsRepository } from '../reconcile/push-clips-repository.ts'

/** Stage with `apply`, commit, push; when the remote advanced meanwhile the
 * push helper rewinds and fast-forwards, and `apply` runs again on the new
 * tip. Three attempts, like the clip movers, because `apply` is deterministic
 * and idempotent by contract: the same staged result every time. */
export const commitAndPushUntilSettled = async (
  repository: string,
  subject: string,
  apply: () => Promise<void>,
): Promise<void> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await apply()
    await commitStagedChanges(repository, subject)
    if (await pushClipsRepository(repository)) return
  }
  throw new Error(`${repository} kept advancing; ${subject} was not pushed`)
}
