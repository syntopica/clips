import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'
import { ledgerRelativePath } from '../ledger/ledger-relative-path.ts'

/** The commit on origin/main that last added this clip's ledger, for
 * reconciling a clip whose publication predates this run (state
 * reconciliation-pending). `--diff-filter=A -1` returns the most recent
 * addition, not the first - the TODO records that premise as false in
 * general - but on this path the ledger was published exactly once, and a
 * re-ingested ledger's most recent addition is also the commit the operator
 * wants recorded. */
export const publishedLedgerCommit = async (
  brainRepository: string,
  clipId: string,
): Promise<string | null> => {
  const args = [
    'log',
    '--diff-filter=A',
    '-1',
    '--format=%H',
    'origin/main',
    '--',
    ledgerRelativePath(clipId),
  ]
  const result = await runGit(brainRepository, args)
  if (result.exitCode !== 0)
    throw new GitFailedError(args, result.exitCode, result.stderr)
  const sha = result.stdout.trim()
  return sha === '' ? null : sha
}
