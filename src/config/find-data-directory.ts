import { existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { DataDirectoryNotFoundError } from './data-directory-not-found-error.ts'
import { resolveSyntopicaPath } from './resolve-syntopica-path.ts'

export function findDataDirectory(
  explicit: string | undefined,
  environ: NodeJS.ProcessEnv,
  start: string,
): string {
  const origin = resolveSyntopicaPath(start)
  const selected = explicit ?? environ['SYNTOPICA_DATA']
  let candidate =
    selected === undefined ? origin : resolveSyntopicaPath(selected, origin)
  for (;;) {
    if (
      statSync(join(candidate, 'syntopica.config.json'), {
        throwIfNoEntry: false,
      })?.isFile()
    )
      return candidate
    if (
      selected !== undefined ||
      existsSync(join(candidate, '.git')) ||
      dirname(candidate) === candidate
    )
      break
    candidate = dirname(candidate)
  }
  throw new DataDirectoryNotFoundError(
    `No syntopica.config.json found from ${origin}${selected === undefined ? '' : ` in selected directory ${candidate}`}`,
  )
}
