import { lstatSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { mergeSyntopicaDocuments } from './merge-syntopica-documents.ts'
import { readSyntopicaDocument } from './read-syntopica-document.ts'
import { resolveSyntopicaPath } from './resolve-syntopica-path.ts'
import { syntopicaValueOrigins } from './syntopica-value-origins.ts'

export function readSyntopicaLayers(root: string): {
  document: Record<string, unknown>
  origins: Map<string, string>
  trackedDirectory: string
} {
  const tracked = resolveSyntopicaPath(join(root, 'syntopica.config.json'))
  const local = join(root, 'syntopica.local.json')
  let document = readSyntopicaDocument(tracked)
  const origins = syntopicaValueOrigins(document, dirname(tracked))
  if (lstatSync(local, { throwIfNoEntry: false })) {
    const overlay = readSyntopicaDocument(local)
    document = mergeSyntopicaDocuments(document, overlay)
    for (const [field, origin] of syntopicaValueOrigins(
      overlay,
      dirname(resolveSyntopicaPath(local)),
    ))
      origins.set(field, origin)
  }
  return { document, origins, trackedDirectory: dirname(tracked) }
}
