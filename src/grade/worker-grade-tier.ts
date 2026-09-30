import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import { readWorkerProfileRunner } from '../worker/read-worker-profile-runner.ts'

/** The grade tier the instance's `clips.grade` worker profile reaches, for the
 * author/verifier guard.
 *
 * Only the CLIs that read a file manifest can grade through the worker, and
 * each maps to exactly one tier. agy cannot - the worker gives it no input
 * files - so a profile naming it, or no profile at all, stops here with the
 * fix rather than failing on the first page. */
export const workerGradeTier = (): 'codex' | 'cursor' => {
  const runner = readWorkerProfileRunner(
    currentSyntopicaConfig().dataRoot,
    'clips.grade',
  )
  if (runner === 'codex' || runner === 'cursor') return runner
  throw new Error(
    'runners.grade is "worker" but worker/config.json defines no clips.grade ' +
      'profile on codex or cursor. Add one, or pick another grade runner.',
  )
}
