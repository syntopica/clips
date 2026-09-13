import { mergePromoteFailures } from './merge-promote-failures.ts'
import type { PromoteFailureAttempt } from './promote-failure-attempt.ts'
import type { PromoteFailure } from './promote-failure.ts'
import { readPromoteFailures } from './read-promote-failures.ts'
import type { TickedArticle } from './ticked-article.ts'
import { writePromoteFailures } from './write-promote-failures.ts'

/** Age the run's durable failure list by what this attempt did, and return what
 * is still outstanding. Read, merge and write are one step because a caller
 * that skipped any of the three would leave the record lying about the run that
 * just happened. */
export const recordPromoteOutcome = async (
  runDirectory: string,
  attempted: readonly TickedArticle[],
  failures: readonly PromoteFailureAttempt[],
  at: string,
): Promise<PromoteFailure[]> => {
  const outstanding = mergePromoteFailures(
    await readPromoteFailures(runDirectory),
    attempted,
    failures,
    at,
  )
  await writePromoteFailures(runDirectory, outstanding)
  return outstanding
}
