import type { GradeRunner } from './grade-runner.ts'
import { PINNED_GRADE_RUNNERS } from './pinned-grade-runners.ts'
import { workerGradeRunner } from './run-worker-grade.ts'
import { WORKER_GRADE_TIMING } from './worker-grade-timing.ts'

/** The transport a `runners.grade` value names, other than `fallback`.
 *
 * `worker` is built per call because it checks each answer against
 * `forbidden`, the tiers that wrote the batch. An unrecognised value throws
 * instead of defaulting, so a typo cannot quietly grade the wiki on a model
 * the caller did not choose. */
export const gradeRunnerNamed = (
  name: string,
  forbidden: readonly string[] | null,
): GradeRunner => {
  const runner =
    name === 'worker'
      ? workerGradeRunner(forbidden, WORKER_GRADE_TIMING)
      : PINNED_GRADE_RUNNERS[name]
  if (runner === undefined) {
    throw new Error(
      `Unknown grade runner "${name}" - expected "codex", "cursor", "agy-fine", "agy-bulk", "worker" or "fallback".`,
    )
  }
  return runner
}
