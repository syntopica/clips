import type { TickedArticle } from './ticked-article.ts'

/** One fetch that failed inside a single promote run, before it is merged into
 * the run's durable history. Carries the article rather than just its url,
 * because a first failure has to write the title and topic that make the
 * outstanding list readable. */
export type PromoteFailureAttempt = {
  article: TickedArticle
  error: string
}
