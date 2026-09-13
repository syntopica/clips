import { join } from 'node:path'
import { brainEngineDirectory } from './brain-engine-directory.ts'

/** `tools/index/` in the brain engine: the real generator the ingest fixture
 * copies into its temporary brain. */
export const INDEX_TOOL_DIRECTORY = join(
  brainEngineDirectory(),
  'tools',
  'index',
)
