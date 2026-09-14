import { existsSync } from 'node:fs'
import { relative } from 'node:path'

import type { SyntopicaConfig } from '../config/syntopica-config.ts'
import type { DoctorCheck } from './doctor-check.ts'

export function doctorPaths(config: SyntopicaConfig): DoctorCheck {
  const missing = config.configuredPaths.filter((path) => !existsSync(path))
  const absentState = config.statePaths.filter((path) => !existsSync(path))
  let message = 'paths: all present'
  if (missing.length > 0) {
    const names = missing
      .map((path) => relative(config.dataRoot, path))
      .join(', ')
    message = `paths: ${String(missing.length)} missing (${names})`
  } else if (absentState.length > 0) {
    message = 'paths: required paths present'
  }
  if (absentState.length > 0) {
    const names = absentState
      .map((path) => relative(config.dataRoot, path))
      .join(', ')
    message += `; state not created yet (${names})`
  }
  return { passed: missing.length === 0, message }
}
