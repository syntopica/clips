import { readSubdirectories } from '../../clips/read-subdirectories.ts'
import { isHarvestDate } from '../is-harvest-date.ts'
import { triageRootPath } from '../triage/triage-root-path.ts'

/** Every dated triage run on disk, newest first.
 *
 * Filtered on the date shape rather than taken as-is, because `inbox/` is a
 * drop zone the user also puts their own directories in, and a run that is not
 * a run has no ticks to be missing. */
export const triageRunDates = async (
  brainRepository: string,
): Promise<string[]> =>
  (await readSubdirectories(triageRootPath(brainRepository)))
    .map((entry) => entry.name)
    .filter((name) => isHarvestDate(name))
    .toSorted((left, right) => right.localeCompare(left))
