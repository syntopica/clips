import { isSyntopicaObject } from './is-syntopica-object.ts'

export function syntopicaValueOrigins(
  document: Record<string, unknown>,
  directory: string,
  prefix = '',
): Map<string, string> {
  const origins = new Map<string, string>()
  for (const [key, value] of Object.entries(document)) {
    const field = prefix ? `${prefix}.${key}` : key
    if (isSyntopicaObject(value)) {
      for (const [child, origin] of syntopicaValueOrigins(
        value,
        directory,
        field,
      ))
        origins.set(child, origin)
    } else origins.set(field, directory)
  }
  return origins
}
