import { rm, writeFile } from 'node:fs/promises'
import type { PromoteFailure } from './promote-failure.ts'
import { promoteFailuresPath } from './promote-failures-path.ts'

/** Persist the run's outstanding failures, or delete the file once there are
 * none.
 *
 * Deleting rather than writing `[]` keeps "no file" as the single meaning of a
 * healthy run, so a reader never has to tell an empty list from a run that
 * predates this record. */
export const writePromoteFailures = async (
  runDirectory: string,
  failures: readonly PromoteFailure[],
): Promise<void> => {
  const path = promoteFailuresPath(runDirectory)
  if (failures.length === 0) {
    await rm(path, { force: true })
    return
  }
  await writeFile(path, `${JSON.stringify(failures, null, 2)}\n`)
}
