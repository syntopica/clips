import type { Clip } from '../clips/clip.ts'
import { moveClip } from './move-clip.ts'
import { pushClipsRepository } from './push-clips-repository.ts'

/** needs-claude back to pending: the inverse of `routeToNeedsClaude`, and a
 * full idempotent operation against the clips repository alone.
 *
 * `failure` is cleared rather than kept, because the state is being asserted as
 * pending and a pending clip carrying a failure would read to `clips status` as
 * a clip that had already been tried and lost. The record of the escalation is
 * the clips repository's history, which the move does not rewrite.
 *
 * Same retry against a moving remote as the other two movers: the push rewinds
 * and fast-forwards, and this move is deterministic enough to re-apply. */
export const requeueClip = async (
  clipsRepository: string,
  clip: Clip,
): Promise<void> => {
  const state = `${JSON.stringify(
    {
      status: 'pending',
      updatedAt: new Date().toISOString(),
      failure: null,
      brainCommit: null,
    },
    null,
    2,
  )}\n`
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await moveClip({
      clipsRepository,
      clipDirectory: clip.directory,
      sourceBucket: 'needs-claude',
      destinationBucket: 'pending',
      state,
      subject: `Requeue clip ${clip.metadata.clip_id} for synthesis`,
    })
    if (await pushClipsRepository(clipsRepository)) return
  }
  throw new Error(
    `the clips repository kept advancing; ${clip.metadata.clip_id} was not requeued`,
  )
}
