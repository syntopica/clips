import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { resolveCommitsInBatch } from './resolve-commits-in-batch.ts'

/** The brainCommits recorded by the clips under processed/, resolved in one
 * batch, ready to hand to `deriveClipState` as `resolvedCommits`. */
export const resolveRecordedCommits = async (
  brainRepository: string,
  clips: readonly (Clip | ThinClip)[],
): Promise<ReadonlyMap<string, string>> =>
  resolveCommitsInBatch(
    brainRepository,
    clips.flatMap((clip) =>
      clip.kind === 'clip' &&
      clip.bucket === 'processed' &&
      clip.state.brainCommit !== null
        ? [clip.state.brainCommit]
        : [],
    ),
  )
