import { loadSyntopicaConfig } from '../config/load-syntopica-config.ts'
import type { DoctorCheck } from './doctor-check.ts'
import { doctorConfigurationFailure } from './doctor-configuration-failure.ts'
import { doctorDocumentOf } from './doctor-document-of.ts'
import { runDoctorChecks } from './run-doctor-checks.ts'

export function doctorReport(
  root: string,
  environ: NodeJS.ProcessEnv,
  json = false,
): number {
  let checks: DoctorCheck[]
  try {
    checks = runDoctorChecks(loadSyntopicaConfig(root, environ), environ)
  } catch (error) {
    checks = [doctorConfigurationFailure(error)]
  }
  if (json)
    process.stdout.write(`${JSON.stringify(doctorDocumentOf(checks))}\n`)
  else
    for (const check of checks)
      process.stdout.write(
        `${check.passed ? 'PASS' : 'FAIL'} ${check.message}\n`,
      )
  return checks.every((check) => check.passed) ? 0 : 1
}
