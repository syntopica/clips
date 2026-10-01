import { workerAuthorModel } from '../worker-synthesis/worker-author-model.ts'
import type { WorkerExecutor } from '../worker/worker-executor.ts'
import { workerAuthorTiers } from './worker-author-tiers.ts'

/** Why a worker grade must be discarded because of who answered it, or null
 * when the answer may stand.
 *
 * The executor ladder decides per job which model answers, so the
 * author/verifier split can only be checked after the fact, against the
 * executor the coordinator reported. `forbidden` is the tiers that wrote the
 * batch, or null where no author is known - the standalone `clips grade`,
 * where the caller was already told the split is theirs to keep. An executor
 * this lane cannot place is refused whenever an author is known, for the same
 * reason an unplaced author refuses every tier. */
export const graderAuthorRefusal = (
  executor: WorkerExecutor | null,
  forbidden: readonly string[] | null,
): string | null => {
  if (forbidden === null) return null
  const grader = workerAuthorModel(executor)
  const tiers = workerAuthorTiers(grader)
  if (tiers === null)
    return `the worker answered on ${grader}, which the grade lane cannot place, so the verdict was discarded`
  const shared = tiers.find((tier) => forbidden.includes(tier))
  return shared === undefined
    ? null
    : `the worker answered on ${grader}, the ${shared} tier that wrote this page, so the verdict was discarded`
}
