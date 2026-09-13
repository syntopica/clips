import { mergeSyntopicaDocuments } from './merge-syntopica-documents.ts'

export function overrideTriageRunner(
  document: Record<string, unknown>,
  environ: NodeJS.ProcessEnv,
): Record<string, unknown> {
  const value = environ['CLIPS_TRIAGE_RUNNER']
  if (value === undefined) return document
  return mergeSyntopicaDocuments(document, { runners: { triage: value } })
}
