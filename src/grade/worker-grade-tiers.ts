import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import { workerAuthorModel } from '../worker-synthesis/worker-author-model.ts'
import { readWorkerProfileExecutor } from '../worker/read-worker-profile-executor.ts'
import { workerAuthorTiers } from './worker-author-tiers.ts'

/** The grade tiers the first rung of the worker's `clips.grade` queue reaches,
 * for the author/verifier guard to check before a batch is submitted.
 *
 * The queue's executor ladder runs the `clips.grade` task profile first, and
 * that profile is the only place its model is written down. The lower rungs
 * (OpenRouter, the local model) are checked per answer instead, against the
 * executor that actually replied. No profile, or one on a CLI this lane cannot
 * place, stops here with the fix rather than failing on the first page. */
export const workerGradeTiers = (): readonly string[] => {
  const executor = readWorkerProfileExecutor(
    currentSyntopicaConfig().dataRoot,
    'clips.grade',
  )
  const tiers =
    executor === null ? null : workerAuthorTiers(workerAuthorModel(executor))
  if (tiers !== null) return tiers
  throw new Error(
    'runners.grade is "worker" but worker/config.json defines no clips.grade ' +
      'profile on a CLI the grade lane knows. Add one, or pick another grade runner.',
  )
}
