import type { Clip } from './clip.ts'
import type { ThinClip } from './thin-clip.ts'

/** SPEC:289 fixes the order: clipped_at, then clip_id. A thin clip has neither,
 * so it sorts last by directory, which keeps the order total and the output of
 * `clips status` stable between runs. */
export const orderClips = (clips: (Clip | ThinClip)[]): (Clip | ThinClip)[] =>
  [...clips].sort((left, right) => {
    if (left.kind === 'thin' && right.kind === 'thin') {
      return left.directory.localeCompare(right.directory)
    }
    if (left.kind === 'thin') return 1
    if (right.kind === 'thin') return -1
    const byDate = left.metadata.clipped_at.localeCompare(
      right.metadata.clipped_at,
    )
    return byDate === 0
      ? left.metadata.clip_id.localeCompare(right.metadata.clip_id)
      : byDate
  })
