import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { walkSyntopicaPath } from './walk-syntopica-path.ts'

export function resolveSyntopicaPath(
  path: string,
  directory = process.cwd(),
): string {
  try {
    return walkSyntopicaPath(path, directory)
  } catch {
    throw new InvalidSyntopicaConfigError(
      'Configuration path cannot be resolved',
    )
  }
}
