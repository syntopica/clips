import type { ClassifiedSyntopicaPaths } from './classified-syntopica-paths.ts'
import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { syntopicaValueAt } from './syntopica-value-at.ts'

export function classifySyntopicaPaths(
  paths: ReadonlyMap<string, readonly string[]>,
  schema: Record<string, unknown>,
): ClassifiedSyntopicaPaths {
  const configuredPaths: string[] = []
  const statePaths: string[] = []
  for (const [field, values] of paths) {
    const node = syntopicaValueAt(
      schema,
      `properties.${field.split('.').join('.properties.')}`,
    ) as Record<string, unknown>
    const kind = node['x-path-kind']
    if (kind !== 'required' && kind !== 'state')
      throw new InvalidSyntopicaConfigError(
        `${field} must declare x-path-kind as required or state`,
      )
    const group = kind === 'required' ? configuredPaths : statePaths
    group.push(...values)
  }
  return {
    configuredPaths: Object.freeze(configuredPaths),
    statePaths: Object.freeze(statePaths),
  }
}
