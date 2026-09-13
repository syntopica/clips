import { mergeSyntopicaDocuments } from './merge-syntopica-documents.ts'

export function overrideTriageRefiner(
  document: Record<string, unknown>,
  environ: NodeJS.ProcessEnv,
): Record<string, unknown> {
  const value = environ['CLIPS_TRIAGE_REFINER']
  if (value === undefined) return document
  return mergeSyntopicaDocuments(document, {
    runners: { triageRefiner: value },
  })
}
