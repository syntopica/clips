import { runGit } from './run-git.ts'

/** Locale-independent ambiguity check: --disambiguate prints one line per
 * matching object. 0 lines is nothing, 1 is unique, 2+ is ambiguous. Reading
 * git's prose ("ambiguous argument", "is ambiguous", ...) is not, because the
 * message text changes with the host locale. */
export const countMatchingObjects = async (
  repository: string,
  abbreviation: string,
): Promise<number> => {
  const result = await runGit(repository, [
    'rev-parse',
    `--disambiguate=${abbreviation}`,
  ])
  if (result.exitCode !== 0) return 0
  return result.stdout.split('\n').filter(Boolean).length
}
