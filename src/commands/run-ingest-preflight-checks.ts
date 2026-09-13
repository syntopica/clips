import { existsSync } from 'node:fs'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { preflightPendingClips } from '../preflight/preflight-pending-clips.ts'
import { preflightRepository } from '../preflight/preflight-repository.ts'
import type { Repositories } from './repositories.ts'

/** Every check `ingest` must pass before it takes a lock or opens a
 * worktree: the clip repository exists, both repositories are on `main` and
 * exactly equal to their `origin/main`, and no pending clip fails its own
 * preflight. Each failure writes its reason to stderr and returns the exit
 * code `ingest` should use; passing returns null. */
export const runIngestPreflightChecks = async (
  repositories: Repositories,
): Promise<number | null> => {
  if (!existsSync(repositories.clips)) {
    process.stderr.write(
      `${repositories.clips} does not exist; run \`clips pull\` first\n`,
    )
    return EXIT_CODE.fatalLocal
  }
  for (const repository of [repositories.brain, repositories.clips]) {
    const preflight = await preflightRepository(repository)
    if (!preflight.ok) {
      process.stderr.write(`${preflight.reason}\n`)
      return EXIT_CODE.fatalLocal
    }
  }
  const pending = await preflightPendingClips(repositories.clips)
  if (!pending.ok) {
    process.stderr.write(`${pending.reason}\n`)
    return EXIT_CODE.fatalLocal
  }
  return null
}
