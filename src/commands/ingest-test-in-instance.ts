import { loadSyntopicaConfig } from '../config/load-syntopica-config.ts'
import { withSyntopicaConfig } from '../config/with-syntopica-config.ts'
import type { IngestDependencies } from './ingest-dependencies.ts'
import type { IngestOptions } from './ingest-options.ts'
import { ingest } from './ingest.ts'
import type { Repositories } from './repositories.ts'

/** `ingest` the way the CLI runs it: inside the brain fixture's own loaded
 * configuration, so the layout, the ledger and the index generator all come
 * from the instance rather than from a test default. */
export const ingestInInstance = async (
  repositories: Repositories,
  options: IngestOptions,
  dependencies: IngestDependencies,
): Promise<number> =>
  withSyntopicaConfig(loadSyntopicaConfig(repositories.brain, {}), async () =>
    ingest(repositories, options, dependencies),
  )
