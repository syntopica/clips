import { statSync } from 'node:fs'
import { isAbsolute, relative, sep } from 'node:path'

import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { resolveSyntopicaPath } from './resolve-syntopica-path.ts'
import { syntopicaGitCommonDirectory } from './syntopica-git-common-directory.ts'
import { validateSyntopicaGitRemotes } from './validate-syntopica-git-remotes.ts'

export function validateSyntopicaGitRoots(
  roots: readonly [string, string, string, string],
): void {
  const archive = resolveSyntopicaPath(roots[1])
  const offset = relative(roots[0], archive)
  if (
    !statSync(archive, { throwIfNoEntry: false })?.isDirectory() ||
    offset.split(sep)[0] === '..' ||
    isAbsolute(offset)
  )
    throw new InvalidSyntopicaConfigError(
      'Archive must be an existing directory within the data directory',
    )
  const repositories = [roots[0], roots[2], roots[3]]
  if (new Set(repositories).size !== repositories.length)
    throw new InvalidSyntopicaConfigError(
      'Data and engines must have three distinct Git roots',
    )
  const identities = new Set<string>()
  for (const root of repositories) {
    identities.add(syntopicaGitCommonDirectory(root))
    validateSyntopicaGitRemotes(root)
  }
  if (identities.size !== repositories.length)
    throw new InvalidSyntopicaConfigError(
      'Data and engines must have three distinct Git roots',
    )
}
