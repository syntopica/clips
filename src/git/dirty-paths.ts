import { runGit } from './run-git.ts'
import { splitNul } from './split-nul.ts'

/** The repository-relative paths carrying uncommitted changes.
 *
 * Read from `--porcelain=v1 -z`, whose every record is `XY <path>` with the
 * path from byte 3. v2 is richer and harder to slice, and nothing here needs
 * the extra fields - only which files a fast-forward could collide with. A
 * rename record carries two NUL-separated paths and both are reported, which
 * over-reports rather than under-reports, and over-reporting is the safe
 * direction for a collision test. */
export const dirtyPaths = async (repository: string): Promise<string[]> => {
  const result = await runGit(repository, [
    'status',
    '--porcelain=v1',
    '-z',
    '--untracked-files=all',
  ])
  return splitNul(result.stdout)
    .map((record) => (record.length > 3 ? record.slice(3) : record))
    .filter((path) => path !== '')
}
