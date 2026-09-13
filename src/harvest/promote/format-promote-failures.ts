import type { PromoteFailure } from './promote-failure.ts'

/** The outstanding-failure block a promote run prints, most-attempted first.
 *
 * It exists because the failure that started this was invisible: five of 79
 * ticked articles never became clips in the 2026-08-08 batch and nothing said
 * so, because the only trace was a stderr line in a scrollback nobody kept.
 * Printing the count next to each url is what separates "Medium 403'd once
 * again, rerun" from "this one has been refused ten times, drop it". */
export const formatPromoteFailures = (
  failures: readonly PromoteFailure[],
): string => {
  if (failures.length === 0) return ''
  const lines = [
    `  unfetched so far ${String(failures.length)} (retried automatically on the next promote)`,
  ]
  for (const failure of [...failures].toSorted(
    (left, right) => right.attempts - left.attempts,
  ))
    lines.push(
      `    ${String(failure.attempts)}x ${failure.url} - ${failure.lastError}`,
    )
  lines.push('')
  return lines.join('\n')
}
