import { isCodexOutOfCredits } from '../harvest/triage/is-codex-out-of-credits.ts'

/** What to report when the grader process failed.
 *
 * Three different things arrive here as the same non-zero exit carrying
 * whatever was on stderr: a timeout kill, an empty codex workspace, and a
 * grader that genuinely failed on the material. Only the third is about the
 * page. The first two are named first so the reader is not left diagnosing the
 * fragment of a clip underneath them - which is exactly what happened on
 * 2026-08-02, twice in one session and for both reasons.
 *
 * The credit wall is detected with the harvest's own `isCodexOutOfCredits`,
 * because codex does not always exit non-zero on it and the message is the only
 * reliable signal.
 *
 * The result is bounded here rather than by the caller. `gradePage` used to
 * take the last 200 characters of it, which silently removed a diagnosis
 * written at the front.
 *
 * `timeoutMs` is passed in rather than read from a constant because the limit
 * scales with the evidence since 2026-08-03: reporting a flat ten minutes to
 * someone whose run was given forty sends them looking for the wrong cause. */
export const gradeFailureTail = (
  failure: {
    stderr?: string
    killed?: boolean
    signal?: string
  },
  timeoutMs: number,
): string => {
  const stderr = failure.stderr ?? ''
  const tail = stderr.trim().slice(-200)
  if (isCodexOutOfCredits('', stderr))
    return `the codex workspace is out of credits, so nothing was graded. ${tail}`
  if (failure.killed !== true) return tail
  const minutes = String(timeoutMs / 60000)
  return `killed after ${minutes} minutes (${failure.signal ?? 'no signal'}): the evidence set is probably too large. ${tail}`
}
