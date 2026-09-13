import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { matchesClipFilter } from './matches-clip-filter.ts'

/** The one clip a `--clip` filter names, or why there is not exactly one.
 *
 * A prefix that matches two clips is refused rather than resolved, because the
 * commands that use this move a directory and commit: guessing which of two
 * the operator meant is the kind of help that has to be undone by hand. Thin
 * clips never match, so an unreadable directory reads as "not found" here and
 * is reported by `clips status`, which exists to describe them. */
export const singleMatchingClip = (
  clips: readonly (Clip | ThinClip)[],
  filter: string,
): Clip | string => {
  const matched = clips
    .filter((clip) => matchesClipFilter(clip, filter))
    .filter((clip): clip is Clip => clip.kind === 'clip')
  const [first] = matched
  if (first === undefined) return `no clip matches ${filter}`
  if (matched.length > 1)
    return `${filter} matches ${String(matched.length)} clips: ${matched
      .map((clip) => clip.metadata.clip_id)
      .join(', ')}`
  return first
}
