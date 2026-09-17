import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { indexToolDirectory } from './ingest-test-index-tool-directory.ts'

/** The configuration schema, keyed by the path it has in a data directory.
 * `syntopica_config_schema.py` reads it from the repository root two levels
 * above `tools/index/`, so the temporary brain needs it at the same place or
 * the index generator dies on import rather than on bad input. */
export function ingestTestSchemaFile(): Record<string, string> {
  return {
    'schema/syntopica-config.schema.json': readFileSync(
      join(
        indexToolDirectory(),
        '..',
        '..',
        'schema',
        'syntopica-config.schema.json',
      ),
      'utf8',
    ),
  }
}
