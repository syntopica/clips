import { InvalidSyntopicaConfigError } from '../config/invalid-syntopica-config-error.ts'
import type { DoctorCheck } from './doctor-check.ts'

/** The single check reported when the configuration does not load or a check
 * throws. Only InvalidSyntopicaConfigError's message is shown, because it is
 * written not to echo supplied values; anything else gets a fixed sentence. */
export const doctorConfigurationFailure = (error: unknown): DoctorCheck => ({
  name: 'configuration',
  passed: false,
  code: 'config_invalid',
  message:
    error instanceof InvalidSyntopicaConfigError
      ? `configuration: ${error.message}`
      : 'configuration: invalid paths, repository identities, remotes or settings',
})
