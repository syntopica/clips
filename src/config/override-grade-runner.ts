import { mergeSyntopicaDocuments } from './merge-syntopica-documents.ts'

export function overrideGradeRunner(
  document: Record<string, unknown>,
  environ: NodeJS.ProcessEnv,
): Record<string, unknown> {
  const value = environ['CLIPS_GRADE_RUNNER']
  if (value === undefined) return document
  return mergeSyntopicaDocuments(document, { runners: { grade: value } })
}
