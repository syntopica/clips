import { findDataDirectory } from './find-data-directory.ts'
import { loadSyntopicaConfig } from './load-syntopica-config.ts'
import { syntopicaConfigContext } from './syntopica-config-context.ts'
import type { SyntopicaConfig } from './syntopica-config.ts'

export function currentSyntopicaConfig(): SyntopicaConfig {
  return (
    syntopicaConfigContext.getStore() ??
    loadSyntopicaConfig(
      findDataDirectory(undefined, process.env, process.cwd()),
      process.env,
    )
  )
}
