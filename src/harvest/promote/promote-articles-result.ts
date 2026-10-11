import type { PromoteFailureAttempt } from './promote-failure-attempt.ts'

export type PromoteArticlesResult = {
  written: number
  failures: PromoteFailureAttempt[]
}
