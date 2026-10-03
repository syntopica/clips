import type { DoctorCheckName } from './doctor-check-name.ts'
import { DOCTOR_CHECK_NAMES } from './doctor-check-names.ts'

/** Read `--json [--skip NAME]...` for `clips doctor`; only valid after
 * `--json`, each NAME a known check. A caller whose environment is deliberately
 * narrower than an operator's, such as a health poller that receives no
 * credentials (orbit, whose subprocess environment is an allowlist), skips the
 * checks that read that environment instead of reporting them failed forever. */
export const parseDoctorSkipArguments = (
  args: readonly string[],
): DoctorCheckName[] => {
  if (args[0] !== '--json')
    throw new Error('doctor does not accept additional arguments')
  const rest = args.slice(1)
  if (rest.length % 2 || rest.some((a, i) => i % 2 === 0 && a !== '--skip'))
    throw new Error('doctor does not accept additional arguments')
  const names = rest.filter((_, i) => i % 2 === 1)
  const known = (name: string): name is DoctorCheckName =>
    (DOCTOR_CHECK_NAMES as readonly string[]).includes(name)
  if (!names.every(known))
    throw new Error('doctor --skip names an unknown check')
  return names
}
