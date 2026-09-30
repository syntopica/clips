import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import { readWorkerInstance } from './read-worker-instance.ts'

/** The model a worker job asks for: `CLIPS_WORKER_MODEL`, else the one model
 * the instance's worker pins. With several pinned the choice is the owner's,
 * so it stops and says which variable makes it. */
export const workerModel = (
  environ: NodeJS.ProcessEnv = process.env,
  dataRoot: () => string = () => currentSyntopicaConfig().dataRoot,
): string => {
  const named = environ['CLIPS_WORKER_MODEL']
  if (named !== undefined && named !== '') return named
  const { models } = readWorkerInstance(dataRoot())
  const [only] = models
  if (models.length === 1 && only !== undefined) return only
  throw new Error(
    `The worker pins ${String(models.length)} models; set CLIPS_WORKER_MODEL to the one triage should use.`,
  )
}
