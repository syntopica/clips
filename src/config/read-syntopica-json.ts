import { readFileSync } from 'node:fs'

import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { isSyntopicaObject } from './is-syntopica-object.ts'
import { validateSyntopicaJsonKeys } from './validate-syntopica-json-keys.ts'

export function readSyntopicaJson(path: string): Record<string, unknown> {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(
      readFileSync(path),
    )
    const value: unknown = JSON.parse(text)
    validateSyntopicaJsonKeys(text)
    if (!isSyntopicaObject(value)) throw new Error('Expected object')
    return value
  } catch {
    throw new InvalidSyntopicaConfigError(
      'Cannot read configuration as safe UTF-8 JSON',
    )
  }
}
