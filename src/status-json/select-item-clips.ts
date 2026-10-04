import { clipCapturedAt } from './clip-captured-at.ts'
import { clipUpdatedAt } from './clip-updated-at.ts'
import type { EvaluatedClip } from './evaluated-clip.ts'
import { RECENT_RECONCILED_ITEMS } from './recent-reconciled-items.ts'

/** Every clip still waiting on something, oldest capture first (undated last),
 * then the most recently changed reconciled clips. */
export const selectItemClips = (
  evaluated: readonly EvaluatedClip[],
): EvaluatedClip[] => {
  const waiting = evaluated
    .filter(({ evidence }) => evidence.state !== 'reconciled')
    .sort(
      (left, right) =>
        (clipCapturedAt(left.clip) ?? Number.MAX_SAFE_INTEGER) -
        (clipCapturedAt(right.clip) ?? Number.MAX_SAFE_INTEGER),
    )
  const done = evaluated
    .filter(({ evidence }) => evidence.state === 'reconciled')
    .sort(
      (left, right) =>
        (clipUpdatedAt(right.clip) ?? 0) - (clipUpdatedAt(left.clip) ?? 0),
    )
    .slice(0, RECENT_RECONCILED_ITEMS)
  return [...waiting, ...done]
}
