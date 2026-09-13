import { syntopicaConfigContext } from './syntopica-config-context.ts'
import type { SyntopicaConfig } from './syntopica-config.ts'

/** Run `body` with this instance's configuration in scope. */
export function withSyntopicaConfig<T>(
  config: SyntopicaConfig,
  body: () => T,
): T {
  return syntopicaConfigContext.run(config, body)
}
