import { mergeSyntopicaDocuments } from './merge-syntopica-documents.ts'

export function overrideCaptureOrigin(
  document: Record<string, unknown>,
  environ: NodeJS.ProcessEnv,
): Record<string, unknown> {
  const value = environ['CAPTURE_SERVICE_ORIGIN']
  if (value === undefined) return document
  return mergeSyntopicaDocuments(document, { capture: { origin: value } })
}
