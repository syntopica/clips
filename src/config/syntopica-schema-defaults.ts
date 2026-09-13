import { isSyntopicaObject } from './is-syntopica-object.ts'

export function syntopicaSchemaDefaults(
  schema: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  if (!isSyntopicaObject(schema['properties'])) return result
  for (const [key, child] of Object.entries(schema['properties'])) {
    if (!isSyntopicaObject(child)) continue
    if (Object.hasOwn(child, 'default'))
      result[key] = structuredClone(child['default'])
    else if (child['type'] === 'object') {
      const nested = syntopicaSchemaDefaults(child)
      if (Object.keys(nested).length > 0) result[key] = nested
    }
  }
  return result
}
