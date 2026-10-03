import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'

export type DeriveClipStateInput = {
  clip: Clip | ThinClip
  brainRepository: string
  clipsRepository: string
  /** brainCommit to full sha, from `resolveCommitsInBatch`. A commit absent
   * here is resolved one at a time, so an empty or missing map is correct,
   * only slower. */
  resolvedCommits?: ReadonlyMap<string, string>
}
