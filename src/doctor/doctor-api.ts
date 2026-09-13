import type { SyntopicaConfig } from '../config/syntopica-config.ts'
import type { DoctorCheck } from './doctor-check.ts'

export function doctorApi(config: SyntopicaConfig): DoctorCheck {
  const supported = config.brainApiVersion === 1 && config.clipsApiVersion === 1
  return {
    passed: supported,
    message: supported ? 'api: supported' : 'api: unsupported engine version',
  }
}
