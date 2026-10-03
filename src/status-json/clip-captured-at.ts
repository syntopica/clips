import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'

/** A thin clip has no metadata, and a clipped_at that does not parse is no
 * better: both are undated rather than guessed at. */
export const clipCapturedAt = (clip: Clip | ThinClip): number | null => {
  if (clip.kind === 'thin') return null
  const time = Date.parse(clip.metadata.clipped_at)
  return Number.isNaN(time) ? null : time
}
