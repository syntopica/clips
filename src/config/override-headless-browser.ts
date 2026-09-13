import { mergeSyntopicaDocuments } from './merge-syntopica-documents.ts'

export function overrideHeadlessBrowser(
  document: Record<string, unknown>,
  environ: NodeJS.ProcessEnv,
): Record<string, unknown> {
  const value = environ['CLIPS_HEADLESS_BROWSER']
  if (value === undefined) return document
  return mergeSyntopicaDocuments(document, { browser: { executable: value } })
}
