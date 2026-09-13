import { existsSync } from 'node:fs'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { clipsRepositoryUrl } from '../clips/clips-repository-url.ts'
import { cloneRepository } from '../git/clone-repository.ts'
import { updateClone } from './update-clone.ts'

/** Clone on first run, otherwise fetch and fast-forward. A non-fast-forward
 * means history was rewritten: report and stop, never merge or reset.
 *
 * The whole body is guarded, not just the merge: cloneRepository and
 * fetchOrigin throw too, and an unguarded throw here escapes runCli and the
 * top-level await in main.ts, so the operator gets ERR_UNHANDLED_REJECTION and
 * a stack trace where an exit code and one sentence belong.
 *
 * repositoryUrl is a parameter so a test can clone from a local file:// origin.
 * Hardcoding it left the clone path as the one branch that runs on a first-ever
 * run and that no test can reach. */
export const pull = async (
  clipsRepository: string,
  repositoryUrl?: string,
): Promise<number> => {
  try {
    if (!existsSync(clipsRepository)) {
      await cloneRepository(
        repositoryUrl ?? clipsRepositoryUrl(),
        clipsRepository,
      )
      process.stdout.write(`cloned into ${clipsRepository}\n`)
      return EXIT_CODE.success
    }
    return await updateClone(clipsRepository)
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return EXIT_CODE.fatalLocal
  }
}
