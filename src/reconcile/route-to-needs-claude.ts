import { mirrorClipState } from '../capture/mirror-clip-state.ts'
import type { Clip } from '../clips/clip.ts'
import { instanceCommitMessage } from '../git/instance-commit-message.ts'
import { clipRelativePath } from './clip-relative-path.ts'
import { moveClip } from './move-clip.ts'
import { NEEDS_CLAUDE_BUCKET } from './needs-claude-bucket.ts'
import type { NeedsClaudeReason } from './needs-claude-reason.ts'
import { pushClipsRepository } from './push-clips-repository.ts'
import { rebucketedPath } from './rebucketed-path.ts'
import { structuredFailure } from './structured-failure.ts'

/** The needs-claude sub-pipeline (SPEC:438-454): a full, idempotent operation
 * against the clips repository only; the brain is untouched. */
export const routeToNeedsClaude = async (
  clipsRepository: string,
  clip: Clip,
  reason: NeedsClaudeReason,
): Promise<void> => {
  const state = `${JSON.stringify(
    {
      status: NEEDS_CLAUDE_BUCKET,
      updatedAt: new Date().toISOString(),
      failure: structuredFailure(
        reason.stage,
        reason.code,
        reason.message,
        false,
      ),
      brainCommit: null,
    },
    null,
    2,
  )}\n`
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await moveClip({
      clipsRepository,
      clipDirectory: clip.directory,
      sourceBucket: 'pending',
      destinationBucket: NEEDS_CLAUDE_BUCKET,
      state,
      subject: instanceCommitMessage({
        kind: 'route',
        clipId: clip.metadata.clip_id,
        code: reason.code,
      }),
    })
    if (await pushClipsRepository(clipsRepository)) {
      // Only once the remote has the move, and never at the cost of the
      // routing itself: mirrorClipState swallows every failure.
      await mirrorClipState({
        url: clip.metadata.url,
        state: NEEDS_CLAUDE_BUCKET,
        clipDir: rebucketedPath(
          clipRelativePath(clipsRepository, clip.directory),
          'pending',
          NEEDS_CLAUDE_BUCKET,
        ),
      })
      return
    }
  }
  throw new Error(
    `the clips repository kept advancing; ${clip.metadata.clip_id} was not routed to needs-claude`,
  )
}
