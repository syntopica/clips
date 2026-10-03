import type { DoctorCheckName } from './doctor-check-name.ts'
import type { DoctorCode } from './doctor-code.ts'

/** `clips doctor --json`: names, outcomes and fixed codes, never the human
 * message, which can carry paths and command names. */
export type DoctorDocument = {
  schemaVersion: 1
  ok: boolean
  checks: { name: DoctorCheckName; ok: boolean; code: DoctorCode }[]
}
