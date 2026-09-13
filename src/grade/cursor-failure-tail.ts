import type { CursorRun } from '../cursor/cursor-run.ts'

/** What to report when a Cursor grading run throws rather than answering.
 *
 * `runCommand` rejects with an `execFile` error carrying `stdout`, `stderr` and
 * a code or signal, and which of those holds the explanation depends on how the
 * run died. Cursor puts its own refusals on **stdout** - `Workspace Trust
 * Required` is the one that matters, printed there with an empty stderr - so a
 * tail that reads stderr alone reports the most common misconfiguration as no
 * message at all. Both are carried, stderr first because a real crash lands
 * there.
 *
 * Bounded at 400 characters for the same reason `agyFailureTail` is: this text
 * reaches a grade report the operator reads per page, and a full transcript
 * there is a wall nobody reads. Unlike that function it filters nothing - it was
 * tuned for one expected sentence and discarded everything else, which is
 * precisely the defect that left the 2026-08-24 batch blocked with `grader
 * exited 1` and no cause. */
export const cursorFailureTail = (run: CursorRun): string => {
  const parts = [run.stderr, run.stdout]
    .filter((part) => part !== '')
    .map((part) => part.trim())
  return parts.length === 0
    ? 'cursor produced no output'
    : parts.join(' | ').slice(-400)
}
