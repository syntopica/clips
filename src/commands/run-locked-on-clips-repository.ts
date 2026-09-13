import { existsSync } from 'node:fs'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { acquireLock } from '../lock/acquire-lock.ts'
import { LockHeldError } from '../lock/lock-held-error.ts'
import { releaseLock } from '../lock/release-lock.ts'

/** Runs the given action under the ingest lock, after checking the clips
 * repository exists. Shared by every command that commits to the clips
 * repository outside the ingest pipeline itself, since an ingest run doing
 * the same at the same moment is exactly the interleaving the lock exists to
 * prevent. A run failure is reported and turned into a fatal exit code rather
 * than thrown, and the lock is always released. */
export const runLockedOnClipsRepository = async (
  brainRepository: string,
  clipsRepository: string,
  run: () => Promise<number>,
): Promise<number> => {
  if (!existsSync(clipsRepository)) {
    process.stderr.write(
      `${clipsRepository} does not exist; run \`clips pull\` first\n`,
    )
    return EXIT_CODE.fatalLocal
  }
  try {
    await acquireLock(brainRepository)
  } catch (error) {
    if (error instanceof LockHeldError) {
      process.stderr.write(`${error.message}\n`)
      return EXIT_CODE.lockHeld
    }
    throw error
  }
  try {
    return await run()
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return EXIT_CODE.fatalLocal
  } finally {
    await releaseLock(brainRepository)
  }
}
