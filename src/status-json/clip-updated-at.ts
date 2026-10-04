import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'

/** state.json's `updatedAt` in epoch milliseconds, or null for a thin clip or
 * a value that does not parse. */
export const clipUpdatedAt = (clip: Clip | ThinClip): number | null => {
  if (clip.kind === 'thin') return null
  const time = Date.parse(clip.state.updatedAt)
  return Number.isNaN(time) ? null : time
}
