import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { syntopicaGitCommonDirectory } from './syntopica-git-common-directory.ts'
import { validateSyntopicaGitRemotes } from './validate-syntopica-git-remotes.ts'

export function validateSyntopicaGitRoots(
  roots: readonly [string, string, string, string],
): void {
  // Temporary Phase 1 compatibility, removed when Phase 5 splits the engines.
  const monorepo = roots[2] === roots[0] && roots[3] === roots[0]
  const repositories = monorepo ? [...new Set(roots)] : roots
  if (new Set(repositories).size !== repositories.length)
    throw new InvalidSyntopicaConfigError(
      'Data, archive and engines must have four distinct Git roots',
    )
  const identities = new Set<string>()
  for (const root of repositories) {
    identities.add(syntopicaGitCommonDirectory(root))
    validateSyntopicaGitRemotes(root)
  }
  if (identities.size !== repositories.length)
    throw new InvalidSyntopicaConfigError(
      'Data, archive and engines must have four distinct Git roots',
    )
}
