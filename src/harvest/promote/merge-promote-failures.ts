import type { PromoteFailureAttempt } from './promote-failure-attempt.ts'
import type { PromoteFailure } from './promote-failure.ts'
import type { TickedArticle } from './ticked-article.ts'

/** The failure list a run leaves behind: what it inherited, aged by what it
 * just tried.
 *
 * Three rules, and the middle one is the reason this is a pure function with
 * its own tests. An article the run did not touch keeps its record untouched -
 * a `--promote` of one topic must not erase another topic's history. An
 * article the run fetched successfully leaves the list, because the clip on
 * disk is now the answer. An article that failed again has its count raised
 * rather than a second entry appended, so `attempts` measures the article and
 * not the number of times someone reran the command. */
export const mergePromoteFailures = (
  previous: readonly PromoteFailure[],
  attempted: readonly TickedArticle[],
  failures: readonly PromoteFailureAttempt[],
  at: string,
): PromoteFailure[] => {
  const attemptedUrls = new Set(attempted.map((article) => article.url))
  const failedByUrl = new Map(
    failures.map((failure) => [failure.article.url, failure]),
  )
  const kept = previous.flatMap((record) => {
    if (!attemptedUrls.has(record.url)) return [record]
    const failure = failedByUrl.get(record.url)
    if (failure === undefined) return []
    failedByUrl.delete(record.url)
    return [
      {
        ...record,
        attempts: record.attempts + 1,
        lastError: failure.error,
        lastAttemptAt: at,
      },
    ]
  })
  return [
    ...kept,
    ...[...failedByUrl.values()].map((failure) => ({
      url: failure.article.url,
      title: failure.article.title,
      topic: failure.article.topic,
      attempts: 1,
      lastError: failure.error,
      lastAttemptAt: at,
    })),
  ]
}
