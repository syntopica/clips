import { isSyntopicaObject } from './is-syntopica-object.ts'
import { validateSyntopicaRemote } from './validate-syntopica-remote.ts'

export function validateSyntopicaUrls(value: unknown): void {
  if (isSyntopicaObject(value)) {
    for (const child of Object.values(value)) validateSyntopicaUrls(child)
  } else if (Array.isArray(value)) {
    for (const child of value) validateSyntopicaUrls(child)
  } else if (typeof value === 'string') validateSyntopicaRemote(value)
}
