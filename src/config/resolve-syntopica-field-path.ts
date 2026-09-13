import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { resolveSyntopicaFieldPaths } from './resolve-syntopica-field-paths.ts'

export function resolveSyntopicaFieldPath(
  document: Record<string, unknown>,
  origins: ReadonlyMap<string, string>,
  root: string,
  field: string,
): string {
  const path = resolveSyntopicaFieldPaths(document, origins, root, field)[0]
  if (path === undefined)
    throw new InvalidSyntopicaConfigError('Configuration path is missing')
  return path
}
