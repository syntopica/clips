import { spawnSync } from 'node:child_process'
import type { SyntopicaGitResult } from './syntopica-git-result.ts'

import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { spawnErrorCode } from './spawn-error-code.ts'

export function runSyntopicaGit(
  root: string,
  arguments_: readonly string[],
): SyntopicaGitResult {
  const result = spawnSync(
    'git',
    ['-c', 'core.fsmonitor=false', '-C', root, ...arguments_],
    {
      encoding: 'utf8',
      timeout: 5000,
      maxBuffer: 1024 * 1024,
      env: {
        PATH: '/usr/bin:/bin',
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_CONFIG_GLOBAL: '/dev/null',
      },
    },
  )
  // The spawn's own code (ETIMEDOUT, EAGAIN, ENOBUFS) says whether the host or
  // the repository failed: four suites once threw this under a load average
  // of 50-80 and passed on rerun, and the bare message could not tell which.
  // Only the code is kept; the error's message names the repository path.
  if (result.error)
    throw new InvalidSyntopicaConfigError(
      `Cannot inspect configured Git repository (${spawnErrorCode(result.error)})`,
    )
  return { status: result.status, stdout: result.stdout }
}
