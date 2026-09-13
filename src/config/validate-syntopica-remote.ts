import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { validateSyntopicaUrl } from './validate-syntopica-url.ts'

export function validateSyntopicaRemote(value: string): void {
  if (value.includes('://')) validateSyntopicaUrl(value)
  else if (/^[^/@\s]+@[^/\s:]+:/u.test(value) && !value.startsWith('git@')) {
    throw new InvalidSyntopicaConfigError(
      'Remote URL must not contain authentication material',
    )
  }
}
