import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'

/** `--clip` accepts a full ULID or the 8-character prefix `clips status`
 * prints. Thin clips have no id and never match. */
export const matchesClipFilter = (
  clip: Clip | ThinClip,
  filter: string | null,
): boolean => {
  if (filter === null) return true
  if (clip.kind === 'thin') return false
  return clip.metadata.clip_id.startsWith(filter.toUpperCase())
}
