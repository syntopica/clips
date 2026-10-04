import type { Synthesizer } from './synthesizer.ts'

/** An unattended synthesis that left the worktree untouched gets one more run.
 *
 * `no pages were written` is mostly transport, not judgement: on 2026-10-04 a
 * Gemini run of clip `01KYSGC20Y9YRDQMR8D2AM28SQ` reported success in 17 s
 * and wrote nothing, and the same prompt on a fresh worktree minutes later
 * wrote two pages; `01KYSGC20Y732928GAYVHDDWNZ` did the same on 2026-09-11.
 * Without the retry each such flake parks a clip in `needs-claude` for a
 * person. One retry, not a loop: a clip that is empty twice goes to the
 * validator, which still refuses it. A run that escalated or skipped is a
 * verdict and is never repeated. */
export const retryEmptySynthesis = (
  inner: Synthesizer,
  wroteNothing: (worktree: string) => Promise<boolean>,
): Synthesizer => ({
  synthesize: async (input) => {
    const first = await inner.synthesize(input)
    if (first.needsClaude || first.skipped) return first
    if (!(await wroteNothing(input.worktree))) return first
    process.stderr.write('synthesis wrote no pages - running it once more\n')
    return inner.synthesize(input)
  },
})
