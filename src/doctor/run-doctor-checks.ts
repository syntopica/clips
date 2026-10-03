import type { SyntopicaConfig } from '../config/syntopica-config.ts'
import { doctorApi } from './doctor-api.ts'
import { doctorArchive } from './doctor-archive.ts'
import type { DoctorCheck } from './doctor-check.ts'
import { doctorCredentials } from './doctor-credentials.ts'
import { doctorExecutables } from './doctor-executables.ts'
import { doctorIngestReadiness } from './doctor-ingest-readiness.ts'
import { doctorPaths } from './doctor-paths.ts'
import { doctorRepositories } from './doctor-repositories.ts'

/** The eight checks of a configuration that loaded, in report order. */
export const runDoctorChecks = (
  config: SyntopicaConfig,
  environ: NodeJS.ProcessEnv,
): DoctorCheck[] => [
  {
    name: 'configuration',
    passed: true,
    code: 'ok',
    message: 'configuration: valid',
  },
  doctorPaths(config),
  doctorRepositories(config),
  doctorArchive(config.archive),
  doctorIngestReadiness(config),
  doctorApi(config),
  doctorExecutables(config, environ),
  doctorCredentials(config, environ),
]
