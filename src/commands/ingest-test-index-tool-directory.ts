import { join } from 'node:path'
import { brainEngineDirectory } from './brain-engine-directory.ts'

/** `tools/index/` in the brain engine: the real generator the ingest fixture
 * copies into its temporary brain. A function rather than a constant, so
 * importing a suite that skips does not demand the checkout. */
export function indexToolDirectory(): string {
  return join(brainEngineDirectory(), 'tools', 'index')
}
