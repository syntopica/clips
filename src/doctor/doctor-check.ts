import type { DoctorCheckName } from './doctor-check-name.ts'
import type { DoctorCode } from './doctor-code.ts'

export type DoctorCheck = {
  readonly name: DoctorCheckName
  readonly passed: boolean
  readonly code: DoctorCode
  /** Human output only; `--json` never prints it. */
  readonly message: string
}
