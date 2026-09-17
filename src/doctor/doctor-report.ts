import { InvalidSyntopicaConfigError } from '../config/invalid-syntopica-config-error.ts'
import { loadSyntopicaConfig } from '../config/load-syntopica-config.ts'
import { doctorApi } from './doctor-api.ts'
import { doctorArchive } from './doctor-archive.ts'
import { doctorCredentials } from './doctor-credentials.ts'
import { doctorExecutables } from './doctor-executables.ts'
import { doctorIngestReadiness } from './doctor-ingest-readiness.ts'
import { doctorPaths } from './doctor-paths.ts'
import { doctorRepositories } from './doctor-repositories.ts'

export function doctorReport(root: string, environ: NodeJS.ProcessEnv): number {
  try {
    const config = loadSyntopicaConfig(root, environ)
    const checks = [
      { passed: true, message: 'configuration: valid' },
      doctorPaths(config),
      doctorRepositories(config),
      doctorArchive(config.archive),
      doctorIngestReadiness(config),
      doctorApi(config),
      doctorExecutables(config, environ),
      doctorCredentials(config, environ),
    ]
    for (const check of checks)
      process.stdout.write(
        `${check.passed ? 'PASS' : 'FAIL'} ${check.message}\n`,
      )
    return checks.every((check) => check.passed) ? 0 : 1
  } catch (error) {
    if (error instanceof InvalidSyntopicaConfigError) {
      process.stdout.write(`FAIL configuration: ${error.message}\n`)
      return 1
    }
    process.stdout.write(
      'FAIL configuration: invalid paths, repository identities, remotes or settings\n',
    )
    return 1
  }
}
