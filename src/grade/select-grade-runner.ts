import type { GradeRunner } from './grade-runner.ts'
import { gradeWithFallback } from './grade-with-fallback.ts'
import { modelsThatWroteBatch } from './models-that-wrote-batch.ts'
import { PINNED_GRADE_RUNNERS } from './pinned-grade-runners.ts'

/** Pick the grading transport from `runners.grade`, which
 * `CLIPS_GRADE_RUNNER` overrides through the configuration loader.
 *
 * An instance that configured none is told so rather than graded on a model it
 * never chose: grading has no interactive floor the way synthesis does, so the
 * honest unconfigured state is a stop with the fix in it.
 *
 * `fallback` means codex with Claude-through-agy behind it. Grading is fine-tier
 * work by the standing routing rule - volume goes to Gemini, judgement goes to
 * codex or to agy's Anthropic and OpenAI models, which cost more quota and have
 * less of it. A grader reads a handful of pages per batch and its answer is
 * acted on without anything re-reading it, so it earns the better model.
 *
 * `codex` pins the confined transport and degrades rather than switching.
 * `agy-fine` pins Claude through agy. `agy-bulk` puts grading on Gemini, for
 * when the fine quotas are gone and a graded page still beats an ungraded one.
 *
 * **A pin no longer overrules the author/verifier split.** It used to: the
 * pinned branches never looked at `author`, so `CLIPS_GRADE_RUNNER=agy-fine`
 * after an agy-fine synthesis returned the page's own author as its grader,
 * with a report that read like a real verdict - while the README promised the
 * model that wrote a page may not grade it. The operator can still choose the
 * transport; what they cannot choose is the author grading itself.
 *
 * `author` is the model that wrote the pages, threaded through so the guard
 * refuses only the tiers that actually wrote them. Null where no run can be
 * asked, and the environment is then the only evidence.
 *
 * An unrecognised value throws instead of defaulting, so a typo cannot quietly
 * grade the wiki on a model the caller did not choose. */
export const selectGradeRunner = (
  name: string | null,
  author: string | null,
): GradeRunner => {
  if (name === null || name === 'manual') {
    throw new Error(
      'No grading transport is configured. Set runners.grade in ' +
        'syntopica.config.json to "codex", "cursor", "agy-fine", "agy-bulk" ' +
        'or "fallback", or export CLIPS_GRADE_RUNNER for one run.',
    )
  }
  if (name === 'fallback') return gradeWithFallback(author)
  const runner = PINNED_GRADE_RUNNERS[name]
  if (runner === undefined) {
    throw new Error(
      `Unknown grade runner "${name}" - expected "codex", "cursor", "agy-fine", "agy-bulk" or "fallback".`,
    )
  }
  if (author === null) {
    // No run to ask, so there is no evidence either way: the standalone
    // command is handed a page and no history. Refusing here would block the
    // ordinary `clips grade --page`, so it reports what it cannot check.
    process.stderr.write(
      `grading on a pinned ${name} without knowing which model wrote this ` +
        "page; the author/verifier split is the caller's to keep here.\n",
    )
    return runner
  }
  if (modelsThatWroteBatch(author, undefined).includes(name)) {
    throw new Error(
      `The configured grade runner "${name}" is a tier that wrote this batch ` +
        `(author=${author}), so grading it would be the author verifying ` +
        'itself. Configure a tier that did not write it, or "fallback" and ' +
        'let it choose.',
    )
  }
  return runner
}
