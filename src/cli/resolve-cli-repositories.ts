import { BRAIN_REPOSITORY_PATH } from '../clips/brain-repository-path.ts'
import type { Repositories } from '../commands/repositories.ts'
import type { SyntopicaConfig } from '../config/syntopica-config.ts'

/** Keep implicit monorepo invocations on their pre-cutover repositories. */
export function resolveCliRepositories(
  config: Pick<
    SyntopicaConfig,
    'dataRoot' | 'archive' | 'brainPath' | 'clipsPath' | 'legacyArchive'
  >,
  explicit: string | undefined,
  environ: NodeJS.ProcessEnv,
): Repositories {
  const implicitMonorepo =
    explicit === undefined &&
    environ['SYNTOPICA_DATA'] === undefined &&
    config.dataRoot === BRAIN_REPOSITORY_PATH &&
    config.dataRoot === config.brainPath &&
    config.dataRoot === config.clipsPath &&
    config.dataRoot === config.archive
  return implicitMonorepo
    ? {
        brain: BRAIN_REPOSITORY_PATH,
        clips: config.legacyArchive ?? config.archive,
      }
    : { brain: config.dataRoot, clips: config.archive }
}
