import { isAbsolute, relative } from 'node:path'

import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { resolveSyntopicaPath } from './resolve-syntopica-path.ts'
import { syntopicaValueAt } from './syntopica-value-at.ts'

export function resolveSyntopicaFieldPaths(
  document: Record<string, unknown>,
  origins: ReadonlyMap<string, string>,
  root: string,
  field: string,
): readonly string[] {
  const value = syntopicaValueAt(document, field)
  const values: unknown[] = Array.isArray(value) ? value : [value]
  const directory = origins.get(field)
  if (directory === undefined)
    throw new InvalidSyntopicaConfigError(
      'Configuration path has no defining file',
    )
  const paths: string[] = []
  for (const item of values) {
    if (typeof item !== 'string')
      throw new InvalidSyntopicaConfigError(
        'Configuration path must be a string',
      )
    const path = resolveSyntopicaPath(item, directory)
    const offset = relative(root, path)
    const contained =
      !field.startsWith('engines.') &&
      !['projects.roots', 'sessions.desktopRoots', 'clips.inbox'].includes(
        field,
      )
    if (
      contained &&
      (offset === '..' || offset.startsWith('../') || isAbsolute(offset))
    )
      throw new InvalidSyntopicaConfigError(
        `${field} escapes the data directory`,
      )
    paths.push(path)
  }
  return Object.freeze(paths)
}
