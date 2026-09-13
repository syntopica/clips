import type { SyntopicaConfig } from '../config/syntopica-config.ts'
import type { DoctorCheck } from './doctor-check.ts'

export function doctorCredentials(
  config: SyntopicaConfig,
  environ: NodeJS.ProcessEnv,
): DoctorCheck {
  if (config.captureOrigin === null && !config.captureMirror)
    return { passed: true, message: 'credentials: CAPTURE_TOKEN not required' }
  const present = Boolean(environ['CAPTURE_TOKEN']?.trim())
  return {
    passed: present,
    message: present
      ? 'credentials: CAPTURE_TOKEN present'
      : 'credentials: CAPTURE_TOKEN absent',
  }
}
