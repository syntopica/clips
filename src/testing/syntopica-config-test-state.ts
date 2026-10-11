import { realpathSync } from 'node:fs'
import { join } from 'node:path'
import type { SyntopicaConfigFixtureState } from './syntopica-config-fixture-state.ts'

import { mergeSyntopicaDocuments } from '../config/merge-syntopica-documents.ts'
import { readSyntopicaJson } from '../config/read-syntopica-json.ts'
import { syntopicaSchemaDefaults } from '../config/syntopica-schema-defaults.ts'
import { syntopicaValueOrigins } from '../config/syntopica-value-origins.ts'
import { makeSyntopicaConfigFixture } from './make-syntopica-config-fixture.ts'
import { temporaryDir } from './temporary-dir.ts'

export function syntopicaConfigTestState(): SyntopicaConfigFixtureState {
  const root = realpathSync(temporaryDir('syntopica-unit-'))
  const data = makeSyntopicaConfigFixture(root)
  const schema = readSyntopicaJson(
    join(root, 'engine-brain/schema/syntopica-config.schema.json'),
  )
  const document = mergeSyntopicaDocuments(
    syntopicaSchemaDefaults(schema),
    readSyntopicaJson(join(data, 'syntopica.config.json')),
  )
  return {
    root,
    data,
    document,
    schema,
    origins: syntopicaValueOrigins(document, data),
  }
}
