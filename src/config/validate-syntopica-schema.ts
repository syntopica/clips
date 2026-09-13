import { fromJSONSchema } from 'zod'

import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { validateSyntopicaSchemaVocabulary } from './validate-syntopica-schema-vocabulary.ts'

export function validateSyntopicaSchema(
  document: Record<string, unknown>,
  schema: Record<string, unknown>,
): void {
  try {
    validateSyntopicaSchemaVocabulary(schema)
    const validator = fromJSONSchema(schema)
    if (!validator.safeParse(document).success)
      throw new Error('Schema validation failed')
  } catch {
    throw new InvalidSyntopicaConfigError(
      'Configuration does not match the brain configuration schema',
    )
  }
}
