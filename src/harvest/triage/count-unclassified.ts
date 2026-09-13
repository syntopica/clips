import type { TriagedArticle } from './triaged-article.ts'
import { UNCLASSIFIED_VERDICT } from './unclassified-verdict.ts'

/** How many articles fell through to the unclassified fallback.
 *
 * Worth counting separately from the review bucket: a review entry the
 * classifier chose is advice, and one it never looked at is a gap. The command
 * reports the difference rather than letting a dead classifier look like a
 * cautious one. */
export const countUnclassified = (
  articles: readonly TriagedArticle[],
): number =>
  articles.filter((article) => article.reason === UNCLASSIFIED_VERDICT.reason)
    .length
