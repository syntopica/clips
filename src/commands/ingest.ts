import { EXIT_CODE } from '../cli/exit-code.ts'
import { discoverClips } from '../clips/discover-clips.ts'
import { orderClips } from '../clips/order-clips.ts'
import { acquireLock } from '../lock/acquire-lock.ts'
import { LockHeldError } from '../lock/lock-held-error.ts'
import { releaseLock } from '../lock/release-lock.ts'
import { ingestClips } from './ingest-clips.ts'
import type { IngestDependencies } from './ingest-dependencies.ts'
import { ingestDryRun } from './ingest-dry-run.ts'
import type { IngestOptions } from './ingest-options.ts'
import { recoverIngestBranches } from './recover-ingest-branches.ts'
import type { Repositories } from './repositories.ts'
import { runIngestPreflightChecks } from './run-ingest-preflight-checks.ts'

/** The pipeline of SPEC:291-436, with synthesis as an injected dependency
 * (codex is disabled by the boundary decision; the CLI wires the interactive
 * human/Claude synthesizer). Dry-run derives and routes but writes nothing,
 * takes no lock, and never opens a worktree. */
export const ingest = async (
  repositories: Repositories,
  options: IngestOptions,
  dependencies: IngestDependencies,
): Promise<number> => {
  const preflightExitCode = await runIngestPreflightChecks(
    repositories,
    !options.dryRun,
  )
  if (preflightExitCode !== null) return preflightExitCode

  if (options.dryRun)
    return ingestDryRun(
      repositories.brain,
      repositories.clips,
      options.clipFilter,
    )

  try {
    await acquireLock(repositories.brain)
  } catch (error) {
    if (error instanceof LockHeldError) {
      process.stderr.write(`${error.message}\n`)
      return EXIT_CODE.lockHeld
    }
    throw error
  }
  try {
    for (const line of await recoverIngestBranches(repositories.brain))
      process.stdout.write(`${line}\n`)
    const clips = orderClips(await discoverClips(repositories.clips))
    return await ingestClips(
      repositories,
      clips,
      options.clipFilter,
      dependencies,
    )
  } finally {
    await releaseLock(repositories.brain)
  }
}
