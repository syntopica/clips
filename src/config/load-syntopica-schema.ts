import { join } from 'node:path'

import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { readSyntopicaJson } from './read-syntopica-json.ts'
import { resolveSyntopicaPath } from './resolve-syntopica-path.ts'
import { syntopicaValueAt } from './syntopica-value-at.ts'

export function loadSyntopicaSchema(
  document: Record<string, unknown>,
  origins: ReadonlyMap<string, string>,
): Record<string, unknown> {
  const path = syntopicaValueAt(document, 'engines.brain.path')
  const directory = origins.get('engines.brain.path')
  if (typeof path !== 'string' || path.length === 0 || directory === undefined)
    throw new InvalidSyntopicaConfigError(
      'A brain checkout is required to load the configuration schema',
    )
  const engine = resolveSyntopicaPath(path, directory)
  return readSyntopicaJson(
    join(engine, 'schema', 'syntopica-config.schema.json'),
  )
}
