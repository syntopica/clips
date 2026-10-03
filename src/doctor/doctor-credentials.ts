import type { SyntopicaConfig } from '../config/syntopica-config.ts'
import type { DoctorCheck } from './doctor-check.ts'

export function doctorCredentials(
  config: SyntopicaConfig,
  environ: NodeJS.ProcessEnv,
): DoctorCheck {
  if (config.captureOrigin === null && !config.captureMirror)
    return {
      name: 'credentials',
      passed: true,
      code: 'credentials_not_required',
      message: 'credentials: CAPTURE_TOKEN not required',
    }
  const present = Boolean(environ['CAPTURE_TOKEN']?.trim())
  return {
    name: 'credentials',
    passed: present,
    code: present ? 'ok' : 'credentials_absent',
    message: present
      ? 'credentials: CAPTURE_TOKEN present'
      : 'credentials: CAPTURE_TOKEN absent',
  }
}
