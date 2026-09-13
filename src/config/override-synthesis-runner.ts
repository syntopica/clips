import { mergeSyntopicaDocuments } from './merge-syntopica-documents.ts'

export function overrideSynthesisRunner(
  document: Record<string, unknown>,
  environ: NodeJS.ProcessEnv,
): Record<string, unknown> {
  const value = environ['CLIPS_SYNTHESIS_RUNNER']
  if (value === undefined) return document
  return mergeSyntopicaDocuments(document, { runners: { synthesis: value } })
}
