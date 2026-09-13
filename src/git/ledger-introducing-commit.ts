import { GitFailedError } from './git-failed-error.ts'
import { runGit } from './run-git.ts'

/** The most recent commit that added this path on HEAD.
 *
 * NOT "the commit that introduced the file", whatever --diff-filter=A suggests:
 * verified by adding a path, deleting it and adding it again, where this
 * command returns the SECOND addition. A ledger is deleted and rewritten on
 * re-ingest, so that sequence is reachable. `-1` also walks HEAD only, so a
 * ledger committed on a branch that is not merged reads as absent.
 *
 * A non-zero exit is a broken repository (no commits, a bad pathspec), not "no
 * such commit": verified at exit 128 with empty stdout in a repository with no
 * commits. Returning null for that reported a broken brain as a successful
 * synthesis, so only exit 0 with empty stdout is null. */
export const ledgerIntroducingCommit = async (
  repository: string,
  path: string,
): Promise<string | null> => {
  const args = ['log', '--diff-filter=A', '-1', '--format=%H', '--', path]
  const result = await runGit(repository, args)
  if (result.exitCode !== 0)
    throw new GitFailedError(args, result.exitCode, result.stderr)
  const sha = result.stdout.trim()
  return sha === '' ? null : sha
}
