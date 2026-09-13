import type { GradeResult } from './grade-result.ts'

/** One page's trip through the grader. `result`, `failure` and `exempt` are
 * mutually exclusive, and there are three of them rather than two because
 * "no unsupported claims", "never graded" and "nothing to grade it against"
 * must not print the same way.
 *
 * `exempt` is the page declaring `verification: exempt`: it maintains itself
 * somewhere else and has no evidence in this repository, so a run against it
 * would report a failure on every future batch - the always-fires shape this
 * repo has already switched one check off for. It is not a failure and does not
 * cost a model call. */
export type GradedPage = {
  page: string
  citedUrls: number
  evidenceClips: number
  result: GradeResult | null
  failure: string | null
  exempt: boolean
}
