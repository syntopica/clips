import { mirrorClipState } from '../capture/mirror-clip-state.ts'
import type { CitedCandidate } from './cited-candidate.ts'
import { clipRelativePath } from './clip-relative-path.ts'
import { moveCitedClipsProcessed } from './move-cited-clips-processed.ts'
import { pushClipsRepository } from './push-clips-repository.ts'
import { rebucketedPath } from './rebucketed-path.ts'

/** The clips-repository half of a cited reconcile, run only once the ledgers
 * are on origin/main: move the candidates to processed under one commit, push
 * with the usual rewind-and-retry against a moving remote, then mirror each
 * clip's state - the same order `reconcileClip` uses clip by clip. A push that
 * keeps losing is an error but not a loss: the ledgers are published, so the
 * next ingest run reconciles the moves clip by clip. */
export const finishCitedReconcile = async (
  clipsRepository: string,
  buildable: readonly CitedCandidate[],
  brainCommit: string,
): Promise<void> => {
  let pushed = false
  for (let attempt = 0; attempt < 3 && !pushed; attempt += 1) {
    await moveCitedClipsProcessed(clipsRepository, buildable, brainCommit)
    pushed = await pushClipsRepository(clipsRepository)
  }
  if (!pushed) {
    throw new Error(
      'the clips repository kept advancing; the ledgers are published and the next ingest run will finish the moves',
    )
  }
  for (const candidate of buildable) {
    await mirrorClipState({
      url: candidate.clip.metadata.url,
      state: 'ingested',
      clipDir: rebucketedPath(
        clipRelativePath(clipsRepository, candidate.clip.directory),
        'pending',
        'processed',
      ),
    })
  }
}
