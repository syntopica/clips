import type { TriageBucket } from './triage-bucket.ts'
import type { TriagedArticle } from './triaged-article.ts'

/** How many of these articles landed in one bucket. */
export const countBucket = (
  articles: readonly TriagedArticle[],
  bucket: TriageBucket,
): number => articles.filter((article) => article.bucket === bucket).length
