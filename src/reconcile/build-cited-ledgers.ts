import type { Repositories } from '../commands/repositories.ts'
import { ledgerRelativePath } from '../ledger/ledger-relative-path.ts'
import { buildLedger } from '../publish/build-ledger.ts'
import { ledgerFileText } from '../publish/ledger-file-text.ts'
import type { CitedCandidate } from './cited-candidate.ts'
import type { CitedLedgers } from './cited-ledgers.ts'
import { clipRelativePath } from './clip-relative-path.ts'
import { RECONCILE_CITED_IDENTITY } from './reconcile-cited-identity.ts'

/** The serialized ledger for every candidate that can produce one. A clip that
 * cannot be hashed - index.md gone since discovery - is reported and skipped
 * rather than aborting the batch: one broken clip must cost one clip.
 * `pagesRead: []` is literal here - no synthesizer ran, so nothing was read. */
export const buildCitedLedgers = async (
  repositories: Repositories,
  candidates: readonly CitedCandidate[],
  clipRepoCommit: string,
  brainBaseCommit: string,
): Promise<CitedLedgers> => {
  const ledgers: { path: string; text: string }[] = []
  const buildable: CitedCandidate[] = []
  for (const candidate of candidates) {
    try {
      const ledger = await buildLedger({
        clip: candidate.clip,
        clipSourcePath: clipRelativePath(
          repositories.clips,
          candidate.clip.directory,
        ),
        clipRepoCommit,
        brainBaseCommit,
        pagesTouched: candidate.pages,
        pagesRead: [],
        identity: RECONCILE_CITED_IDENTITY,
      })
      ledgers.push({
        path: ledgerRelativePath(ledger.clipId),
        text: await ledgerFileText(repositories.brain, ledger),
      })
      buildable.push(candidate)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      process.stdout.write(
        `${candidate.clip.metadata.clip_id}: skipped (${message})\n`,
      )
    }
  }
  return { ledgers, buildable }
}
