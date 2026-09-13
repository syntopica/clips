import { readSyntopicaJson } from './read-syntopica-json.ts'
import { validateSyntopicaUrls } from './validate-syntopica-urls.ts'

export function readSyntopicaDocument(path: string): Record<string, unknown> {
  const document = readSyntopicaJson(path)
  validateSyntopicaUrls(document)
  return document
}
