import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { mergeSyntopicaDocuments } from './merge-syntopica-documents.ts'

export function overrideCaptureMirror(
  document: Record<string, unknown>,
  environ: NodeJS.ProcessEnv,
): Record<string, unknown> {
  const value = environ['CAPTURE_MIRROR']
  if (value === undefined) return document
  if (value !== 'on' && value !== 'off')
    throw new InvalidSyntopicaConfigError('CAPTURE_MIRROR must be on or off')
  return mergeSyntopicaDocuments(document, {
    capture: { mirror: value === 'on' },
  })
}
