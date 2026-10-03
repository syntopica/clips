import type { DoctorCheckName } from './doctor-check-name.ts'
import type { DoctorCheck } from './doctor-check.ts'
import type { DoctorDocument } from './doctor-document.ts'

/** A skipped check still appears, passing with code `skipped`. */
export const doctorDocumentOf = (
  checks: readonly DoctorCheck[],
  skip: readonly DoctorCheckName[] = [],
): DoctorDocument => {
  const entries = checks.map(({ name, passed, code }) =>
    skip.includes(name)
      ? { name, ok: true, code: 'skipped' as const }
      : { name, ok: passed, code },
  )
  return {
    schemaVersion: 1,
    ok: entries.every((entry) => entry.ok),
    checks: entries,
  }
}
