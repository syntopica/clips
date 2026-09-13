/** What one `cursor-agent` print-mode run produced.
 *
 * Deliberately not `CodexRunResult`: that type carries a `lastMessage` already
 * pulled out of a transport's envelope, and unwrapping is the caller's job here
 * because the grade and synthesis lanes want different fields out of the same
 * JSON. This is the raw process boundary, and `failed` collapses the several
 * ways a run can die - non-zero exit, a timeout kill, a binary that is not
 * there - into the one distinction every caller actually makes. */
export type CursorRun = {
  stdout: string
  stderr: string
  failed: boolean
}
