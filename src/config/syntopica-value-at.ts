import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { isSyntopicaObject } from './is-syntopica-object.ts'

export function syntopicaValueAt(
  document: Record<string, unknown>,
  field: string,
): unknown {
  let value: unknown = document
  for (const key of field.split('.')) {
    if (!isSyntopicaObject(value) || !Object.hasOwn(value, key))
      throw new InvalidSyntopicaConfigError(
        'Configuration is missing a required setting',
      )
    value = value[key]
  }
  return value
}
