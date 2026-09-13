import { AmbiguousCommitError } from './ambiguous-commit-error.ts'
import { countMatchingObjects } from './count-matching-objects.ts'
import { GitFailedError } from './git-failed-error.ts'
import { HEX_ABBREVIATION } from './hex-abbreviation.ts'
import { runGit } from './run-git.ts'

/** An abbreviated sha is read for legacy compatibility only and never written
 * back. An ambiguous one is an error, never resolved arbitrarily: SPEC:262-268.
 *
 * Ambiguity is detected by counting matching objects
 * (`rev-parse --disambiguate`), not by matching git's prose in stderr: that
 * prose is locale-dependent ("fatal: Needed a single revision" in English has
 * no "ambiguous"/"short SHA1" substring at all), so a text match silently
 * never fires and every ambiguous sha would be misreported as GitFailedError. */
export const resolveCommit = async (
  repository: string,
  revision: string,
): Promise<string> => {
  const args = [
    'rev-parse',
    '--verify',
    '--end-of-options',
    `${revision}^{commit}`,
  ]
  const result = await runGit(repository, args)
  if (result.exitCode === 0) return result.stdout.trim()
  if (
    HEX_ABBREVIATION.test(revision) &&
    (await countMatchingObjects(repository, revision)) > 1
  ) {
    throw new AmbiguousCommitError(revision)
  }
  throw new GitFailedError(args, result.exitCode, result.stderr)
}
