import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { isSyntopicaObject } from './is-syntopica-object.ts'

export function validateSyntopicaSchemaVocabulary(
  schema: Record<string, unknown>,
): void {
  const supported = new Set([
    '$schema',
    'title',
    'description',
    'type',
    'default',
    'properties',
    'additionalProperties',
    'required',
    'items',
    'enum',
    'minimum',
    'minLength',
    'pattern',
    'format',
    'x-path-kind',
  ])
  if (Object.keys(schema).some((key) => !supported.has(key)))
    throw new InvalidSyntopicaConfigError(
      'Unsupported configuration schema keyword',
    )
  if (schema['format'] !== undefined && schema['format'] !== 'uri')
    throw new InvalidSyntopicaConfigError(
      'Unsupported configuration schema format',
    )
  if (isSyntopicaObject(schema['properties'])) {
    for (const child of Object.values(schema['properties'])) {
      if (!isSyntopicaObject(child))
        throw new InvalidSyntopicaConfigError('Invalid configuration schema')
      validateSyntopicaSchemaVocabulary(child)
    }
  }
  if (isSyntopicaObject(schema['items']))
    validateSyntopicaSchemaVocabulary(schema['items'])
}
