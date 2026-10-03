import type { DoctorCheck } from './doctor-check.ts'
import type { DoctorDocument } from './doctor-document.ts'

export const doctorDocumentOf = (
  checks: readonly DoctorCheck[],
): DoctorDocument => ({
  schemaVersion: 1,
  ok: checks.every((check) => check.passed),
  checks: checks.map(({ name, passed, code }) => ({ name, ok: passed, code })),
})
