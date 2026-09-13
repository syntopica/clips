import { agyBulkGrader } from './agy-bulk-grader.ts'
import { agyFineGrader } from './agy-fine-grader.ts'
import { cursorGrader } from './cursor-grader.ts'
import type { GradeRunner } from './grade-runner.ts'
import { gradeWithFallback } from './grade-with-fallback.ts'
import { runCodexGrade } from './run-codex-grade.ts'

/** Pick the grading transport from `CLIPS_GRADE_RUNNER`.
 *
 * Unset means codex with Claude-through-agy behind it. Grading is fine-tier
 * work by the standing routing rule - volume goes to Gemini, judgement goes to
 * codex or to agy's Anthropic and OpenAI models, which cost more quota and have
 * less of it. A grader reads a handful of pages per batch and its answer is
 * acted on without anything re-reading it, so it earns the better model.
 *
 * `codex` pins the confined transport and degrades rather than switching.
 * `agy-fine` pins Claude through agy. `agy-bulk` puts grading on Gemini, for
 * when the fine quotas are gone and a graded page still beats an ungraded one.
 * A pin answers to the caller alone: the author/verifier guard only stands
 * behind the default, because pinning is how the operator overrules it.
 *
 * `author` is the model that wrote the pages, threaded through to the fallback
 * so it refuses only the tiers that actually wrote them. Null where no run can
 * be asked.
 *
 * An unrecognised value throws instead of defaulting, so a typo cannot quietly
 * grade the wiki on a model the caller did not choose. */
export const selectGradeRunner = (
  name: string | undefined,
  author: string | null,
): GradeRunner => {
  if (name === undefined) return gradeWithFallback(author)
  if (name === 'fallback') return gradeWithFallback(author)
  if (name === 'codex') return runCodexGrade
  if (name === 'agy-fine') return agyFineGrader
  if (name === 'agy-bulk') return agyBulkGrader
  if (name === 'cursor') return cursorGrader
  throw new Error(
    `Unknown CLIPS_GRADE_RUNNER "${name}" - expected "codex", "cursor", "agy-fine", "agy-bulk" or "fallback".`,
  )
}
