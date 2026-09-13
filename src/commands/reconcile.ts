import { EXIT_CODE } from '../cli/exit-code.ts'
import { reconcileCited } from './reconcile-cited.ts'
import { runLockedOnClipsRepository } from './run-locked-on-clips-repository.ts'

/** Bookkeeping passes over the clip store. `--cited` is the only mode today:
 * ledger the pending clips whose urls the wiki already cites and move them to
 * processed, no synthesis anywhere. It takes the ingest lock because it
 * commits to both repositories, and an ingest run doing the same at the same
 * moment is exactly the interleaving the lock exists to prevent. `--dry-run`
 * reads both repositories and writes nothing, but still locks - the read spans
 * the two and a concurrent move would make its answer wrong. */
export const reconcile = async (
  brainRepository: string,
  clipsRepository: string,
  options: { cited: boolean; dryRun: boolean },
): Promise<number> => {
  if (!options.cited) {
    process.stderr.write('reconcile needs --cited\n')
    return EXIT_CODE.fatalLocal
  }
  return runLockedOnClipsRepository(
    brainRepository,
    clipsRepository,
    async () =>
      reconcileCited(
        { brain: brainRepository, clips: clipsRepository },
        options.dryRun,
      ),
  )
}
