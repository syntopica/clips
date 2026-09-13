import { runGit } from './run-git.ts'

/** Does this repository have this ref? Verified: `rev-parse --verify --quiet`
 * exits 1 for a ref that is not there and 0 when it resolves, so the exit code
 * is the whole answer and no message is parsed. origin/main is missing in a
 * fresh clone before the first fetch, and in any repository with no remote. */
export const refExists = async (
  repository: string,
  ref: string,
): Promise<boolean> => {
  const result = await runGit(repository, [
    'rev-parse',
    '--verify',
    '--quiet',
    '--end-of-options',
    `${ref}^{commit}`,
  ])
  return result.exitCode === 0
}
