import { runSyntopicaGit } from '../config/run-syntopica-git.ts'

/** Does this ref name a commit in this repository? `rev-parse --verify --quiet`
 * answers with its exit code alone, so nothing is parsed and a repository with
 * no commits is a false rather than a thrown error. */
export function resolvesCommit(repository: string, ref: string): boolean {
  return (
    runSyntopicaGit(repository, [
      'rev-parse',
      '--verify',
      '--quiet',
      '--end-of-options',
      `${ref}^{commit}`,
    ]).status === 0
  )
}
