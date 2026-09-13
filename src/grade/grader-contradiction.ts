import type { GradeResult } from './grade-result.ts'

/** The grader's label against its own list, returning the reason they disagree
 * or null when they do not.
 *
 * Found on 2026-08-02 by pointing the grader at a page: it printed
 * `clean (1/1 cited sources on disk)` and `0 unsupported claims`, and then
 * described two real problems in its summary. The prose was right and the count
 * was wrong, so anything automating on the count - which is what the post-ingest
 * loop does - would have shipped both errors as verified.
 *
 * Asking for the label is what makes that visible: a grader that finds problems
 * and empties the list now has to say so in a field code can read. The caller
 * turns a disagreement into `not graded`, on the same principle as
 * `fallbackGraderAfterCodex` - an ungraded page the operator knows about beats a
 * graded-looking one.
 *
 * `misattributed` counts on both sides, because it is an error on the page in
 * the same way `unsupported` is - the marker names the wrong source. Only
 * `uncheckable` stays out of the arithmetic, for the reason `grade-result.ts`
 * gives.
 *
 * What it does not catch, and cannot: a grader that labels itself `clean` and
 * buries its findings in the summary sentence. Reading that would need a
 * heuristic over prose, which is the always-fires failure that killed the
 * hand-edited check. */
export const graderContradiction = (result: GradeResult): string | null => {
  if (
    result.verdict === 'unsupported' &&
    result.unsupported.length === 0 &&
    result.misattributed.length === 0
  )
    return `grader labelled the page unsupported and listed no claim; its summary reads: ${result.summary}`
  if (result.verdict === 'clean' && result.unsupported.length > 0)
    return `grader labelled the page clean and listed ${String(result.unsupported.length)} unsupported claims`
  if (result.verdict === 'clean' && result.misattributed.length > 0)
    return `grader labelled the page clean and listed ${String(result.misattributed.length)} misattributed claims`
  return null
}
