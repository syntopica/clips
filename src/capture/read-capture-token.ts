/** The bearer token every call to the capture service carries.
 *
 * From the environment and never from a file in either repository: the brain
 * stores it inline by design, but this package is the thing that would put it
 * on a command line or into a log, and a token read from `process.env` at the
 * moment of use is one that never has to be written down twice.
 *
 * Missing is an error rather than an anonymous request, because the service
 * answers `401` to those and a run would report an authorisation failure when
 * the real fault is a shell that forgot to export. */
export const readCaptureToken = (): string => {
  const token = process.env['CAPTURE_TOKEN']
  if (token === undefined || token === '')
    throw new Error(
      'CAPTURE_TOKEN is not set; it is recorded in the brain under business/databases-smtp.md',
    )
  return token
}
