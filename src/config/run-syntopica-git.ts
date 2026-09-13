import { spawnSync } from 'node:child_process'

import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'

export function runSyntopicaGit(
  root: string,
  arguments_: readonly string[],
): { status: number | null; stdout: string } {
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
  if (result.error)
    throw new InvalidSyntopicaConfigError(
      'Cannot inspect configured Git repository',
    )
  return { status: result.status, stdout: result.stdout }
}
