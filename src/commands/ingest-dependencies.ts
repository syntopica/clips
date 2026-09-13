import type { PageGrader } from '../grade/page-grader.ts'
import type { Reviewer } from '../review/reviewer.ts'
import type { Synthesizer } from '../synthesis/synthesizer.ts'

/** Injected so tests drive the pipeline with a scripted synthesizer and an
 * always-approving reviewer; the CLI wires the interactive pair. There is no
 * --yes flag (SPEC:281-284).
 *
 * `grader` is null unless `--grade` was named, and null is spelled out rather
 * than left optional: a run that is not graded should say so at the call site,
 * not by omission. */
export type IngestDependencies = {
  synthesizer: Synthesizer
  reviewer: Reviewer
  grader: PageGrader | null
}
