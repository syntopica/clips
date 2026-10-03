import { loadSyntopicaConfig } from '../config/load-syntopica-config.ts'
import type { DoctorCheckName } from './doctor-check-name.ts'
import type { DoctorCheck } from './doctor-check.ts'
import { doctorConfigurationFailure } from './doctor-configuration-failure.ts'
import { doctorDocumentOf } from './doctor-document-of.ts'
import { runDoctorChecks } from './run-doctor-checks.ts'

export function doctorReport(
  root: string,
  environ: NodeJS.ProcessEnv,
  json = false,
  skip: readonly DoctorCheckName[] = [],
): number {
  let checks: DoctorCheck[]
  try {
    checks = runDoctorChecks(loadSyntopicaConfig(root, environ), environ)
  } catch (error) {
    checks = [doctorConfigurationFailure(error)]
  }
  if (json) {
    const document = doctorDocumentOf(checks, skip)
    process.stdout.write(`${JSON.stringify(document)}\n`)
    return document.ok ? 0 : 1
  }
  for (const check of checks)
    process.stdout.write(`${check.passed ? 'PASS' : 'FAIL'} ${check.message}\n`)
  return checks.every((check) => check.passed) ? 0 : 1
}
