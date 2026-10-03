import type { DOCTOR_CHECK_NAMES } from './doctor-check-names.ts'

/** The fixed identity of each `clips doctor` check, stable across releases so
 * a consumer of `clips doctor --json` can key on it. */
export type DoctorCheckName = (typeof DOCTOR_CHECK_NAMES)[number]
