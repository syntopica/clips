import { configuredRunner } from '../config/configured-runner.ts'
import { isCodexOutOfCredits } from '../harvest/triage/is-codex-out-of-credits.ts'
import { fallbackGraderAfterCodex } from './fallback-grader-after-codex.ts'
import type { GradeRunner } from './grade-runner.ts'
import { gradeableEvidence } from './gradeable-evidence.ts'
import { runCodexGrade } from './run-codex-grade.ts'

/** codex first, Claude through agy when the codex workspace is empty.
 *
 * Both are the fine tier, which is where grading belongs: it reads a handful of
 * pages per batch and nothing downstream re-reads its answer. codex leads
 * because it is the confined one - `-s read-only`, no network - and the grader
 * is handed the full text of captured web articles.
 *
 * The trigger is narrow on purpose, the same rule the harvest fallback follows:
 * only the credit wall switches transport, because it is the one codex failure
 * no retry clears. A timeout or an unreadable answer stays a failure on codex
 * rather than being quietly re-answered by a different model.
 *
 * The switch is announced, because two models do not agree closely enough for
 * the substitution to be invisible in a report the operator acts on.
 *
 * `author` is the model the synthesis run reported for itself, or null where
 * there is no run to ask - the standalone `clips grade`. It is a parameter
 * rather than a configuration read because the configuration names the
 * transport that was requested, and `selectSynthesizer` overrides that request
 * in three ways; the guard needs what wrote the page, not what was asked
 * for. */
export const gradeWithFallback = (author: string | null): GradeRunner => ({
  // The primary transport's, not the smaller of the two: a page codex can
  // grade must not be refused up front because the fallback it may never
  // reach could not take it. The fallback checks its own ceiling below.
  evidenceCeilingBytes: runCodexGrade.evidenceCeilingBytes,
  run: async (root, pagePath, evidencePaths) => {
    const codex = await runCodexGrade.run(root, pagePath, evidencePaths)
    if (!isCodexOutOfCredits('', codex.stderrTail)) return codex
    const grader = fallbackGraderAfterCodex(
      author,
      configuredRunner('synthesis') ?? undefined,
    )
    const overCeiling = await gradeableEvidence(
      evidencePaths,
      grader.evidenceCeilingBytes,
    )
    if (overCeiling !== null)
      return {
        exitCode: 1,
        lastMessage: null,
        stderrTail: `codex is out of credits and the fallback cannot take this page: ${overCeiling}`,
      }
    process.stderr.write(
      'codex is out of credits - grading through agy instead, on a model that ' +
        'did not write this batch. Verdicts in this run may come from two ' +
        'different models; pin one with CLIPS_GRADE_RUNNER.\n',
    )
    return grader.run(root, pagePath, evidencePaths)
  },
})
