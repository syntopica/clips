import type { Repositories } from '../commands/repositories.ts'
import type { SyntopicaConfig } from '../config/syntopica-config.ts'

/** The brain is the data directory and the archive is wherever the instance
 * declares it; nothing else decides which repositories a command works on. */
export function resolveCliRepositories(
  config: Pick<SyntopicaConfig, 'dataRoot' | 'archive'>,
): Repositories {
  return { brain: config.dataRoot, clips: config.archive }
}
