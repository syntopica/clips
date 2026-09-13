import { existsSync } from 'node:fs'
import { relative } from 'node:path'

import type { SyntopicaConfig } from '../config/syntopica-config.ts'
import type { DoctorCheck } from './doctor-check.ts'

export function doctorPaths(config: SyntopicaConfig): DoctorCheck {
  const paths = [
    ...config.pages,
    config.sources,
    config.index,
    config.ledger,
    config.archive,
    config.memPath,
    config.brainPath,
    config.clipsPath,
    config.newsletterAcceptedSenders,
    config.newsletterRejectedSenders,
    config.newsletterRejectedBookingSenders,
    config.projectAliases,
    ...config.projectRoots,
  ]
  const missing = paths.filter((path) => !existsSync(path))
  if (missing.length === 0) {
    return { passed: true, message: 'paths: all present' }
  }
  // A count alone sends the reader back to the source to find out which path
  // is wrong. These are paths from the instance the caller already selected,
  // not secrets.
  const names = missing
    .map((path) => relative(config.dataRoot, path))
    .join(', ')
  return {
    passed: false,
    message: `paths: ${String(missing.length)} missing (${names})`,
  }
}
