import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INDEX_TOOL_DIRECTORY } from './ingest-test-index-tool-directory.ts'

/** The configuration schema, keyed by the path it has in a data directory.
 * `syntopica_config_schema.py` reads it from the repository root two levels
 * above `tools/index/`, so the temporary brain needs it at the same place or
 * the index generator dies on import rather than on bad input. */
export const INGEST_TEST_SCHEMA_FILE: Record<string, string> = {
  'schema/syntopica-config.schema.json': readFileSync(
    join(
      INDEX_TOOL_DIRECTORY,
      '..',
      '..',
      'schema',
      'syntopica-config.schema.json',
    ),
    'utf8',
  ),
}
