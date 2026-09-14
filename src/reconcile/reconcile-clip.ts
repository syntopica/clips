import { mirrorClipState } from '../capture/mirror-clip-state.ts'
import type { Clip } from '../clips/clip.ts'
import { instanceCommitMessage } from '../git/instance-commit-message.ts'
import { pathExistsInRef } from '../git/path-exists-in-ref.ts'
import { refExists } from '../git/ref-exists.ts'
import { ledgerRelativePath } from '../ledger/ledger-relative-path.ts'
import { clipRelativePath } from './clip-relative-path.ts'
import { moveClip } from './move-clip.ts'
import { pushClipsRepository } from './push-clips-repository.ts'
import { rebucketedPath } from './rebucketed-path.ts'

/** SPEC:416-433: a local ledger is not a published result. The clip moves to
 * processed/ only once the ledger is visible on origin/main, and `brainCommit`
 * is written in full form. Presence is answered with
 * `cat-file -e origin/main:<path>` - no history reasoning (the
 * `--diff-filter=A` premise is recorded false in TODO). The move is retried
 * against a moving remote at most twice. */
export const reconcileClip = async (
  clipsRepository: string,
  brainRepository: string,
  clip: Clip,
  brainCommit: string,
): Promise<void> => {
  if (!(await refExists(brainRepository, 'origin/main')))
    throw new Error(`${brainRepository} has no origin/main`)
  const clipId = clip.metadata.clip_id
  const ledger = ledgerRelativePath(clipId)
  if (!(await pathExistsInRef(brainRepository, 'origin/main', ledger)))
    throw new Error(
      `the ledger for ${clip.metadata.clip_id} is not on origin/main; publication is incomplete`,
    )
  const state = `${JSON.stringify(
    {
      status: 'processed',
      updatedAt: new Date().toISOString(),
      failure: null,
      brainCommit,
    },
    null,
    2,
  )}\n`
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await moveClip({
      clipsRepository,
      clipDirectory: clip.directory,
      sourceBucket: 'pending',
      destinationBucket: 'processed',
      state,
      subject: instanceCommitMessage({ kind: 'process', clipId }),
    })
    if (await pushClipsRepository(clipsRepository)) {
      // Mirror only published state; the ledger remains authoritative.
      await mirrorClipState({
        url: clip.metadata.url,
        state: 'ingested',
        clipDir: rebucketedPath(
          clipRelativePath(clipsRepository, clip.directory),
          'pending',
          'processed',
        ),
      })
      return
    }
  }
  throw new Error(
    `the clips repository kept advancing; ${clip.metadata.clip_id} was not reconciled`,
  )
}
