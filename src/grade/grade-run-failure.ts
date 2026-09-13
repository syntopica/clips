import type { CodexRunResult } from '../codex/codex-run-result.ts'

/** Why a grader run produced nothing readable.
 *
 * The stderr tail is not re-sliced: `gradeFailureTail` puts its diagnosis at
 * the front and bounds the whole string, and taking the last 200 characters
 * here threw that diagnosis away - which is how a credit wall kept printing as
 * a fragment of a clip.
 *
 * **The exit-0 branch carried no evidence at all until 2026-09-11**, and that
 * omission is the other half of the same lesson. A transport that answers
 * successfully with something the parser cannot read puts its explanation in
 * the tail - a refusal envelope, prose where JSON was asked for, a quota
 * sentence - and this function dropped it on the floor, leaving the operator
 * the bare words "no readable verdict" for every one of those causes. Found
 * while grading the blocked 2026-08-24 batch on a new transport, where the
 * message was true, useless, and identical to the one the previous transport
 * had been giving for three weeks.
 *
 * An empty tail still prints the bare sentence rather than a dangling colon:
 * the codex runner reports success with no stderr, so there is genuinely
 * nothing to show and saying so beats punctuation. */
export const gradeRunFailure = (run: CodexRunResult): string => {
  if (run.exitCode !== 0)
    return `grader exited ${String(run.exitCode)}: ${run.stderrTail}`
  return run.stderrTail === ''
    ? 'grader returned no readable verdict'
    : `grader returned no readable verdict: ${run.stderrTail}`
}
