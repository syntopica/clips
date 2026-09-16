import { existsSync } from 'node:fs'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import { cloneRepository } from '../git/clone-repository.ts'
import { collectInbox } from '../inbox/collect-inbox.ts'
import { inboxRepositoryUrl } from '../inbox/inbox-repository-url.ts'
import { runLockedOnClipsRepository } from './run-locked-on-clips-repository.ts'
import { updateClone } from './update-clone.ts'

/** Bring the inbox up to date and hand its pending clips to the archive.
 *
 * The inbox is the repository the browser clipper commits to; the archive
 * lives inside the instance and is where every other command reads. Cloning
 * on first run and fast-forwarding after that is the old `pull`; the
 * hand-over is what makes a clip captured in a browser reach `clips ingest`.
 * The archive write takes the ingest lock like `requeue` does, because a
 * commit landing in the archive while an ingest run commits there too is the
 * interleaving the lock exists to prevent.
 *
 * `inbox` and `repositoryUrl` are parameters so a test can work against a
 * local file:// origin; the CLI passes what the instance declares. The whole
 * body is guarded, as before: cloneRepository and fetchOrigin throw, and an
 * unguarded throw here escapes runCli with a stack trace where an exit code
 * and one sentence belong. */
export const pull = async (
  brainRepository: string,
  clipsRepository: string,
  inbox: string | null = currentSyntopicaConfig().inbox,
  repositoryUrl?: string,
): Promise<number> => {
  if (inbox === null) {
    process.stderr.write(
      'clips.inbox is not configured; this instance has no browser clipper to pull from\n',
    )
    return EXIT_CODE.fatalLocal
  }
  try {
    if (!existsSync(inbox)) {
      await cloneRepository(repositoryUrl ?? inboxRepositoryUrl(), inbox)
      process.stdout.write(`cloned the inbox into ${inbox}\n`)
    } else {
      const updated = await updateClone(inbox)
      if (updated !== EXIT_CODE.success) return updated
    }
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return EXIT_CODE.fatalLocal
  }
  return runLockedOnClipsRepository(
    brainRepository,
    clipsRepository,
    async () => collectInbox(inbox, clipsRepository),
  )
}
